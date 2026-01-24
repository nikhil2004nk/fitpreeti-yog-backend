import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  Scope,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { UserLite } from '../common/interfaces/user.interface';
import { SessionService } from './session.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: UserLite }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.validateUserCredentials(email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.sessionService.createSession(
      user.id,
      refreshToken,
      (this.request.headers['user-agent'] as string) || 'unknown',
      (this.request.headers['x-forwarded-for'] as string) || this.request.socket?.remoteAddress || 'unknown',
      refreshExpiresAt,
    );

    user.last_login = new Date();
    user.is_active = true;
    await this.userRepository.save(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const session = await this.sessionService.findSessionByToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.findUserById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    await this.sessionService.invalidateSession(refreshToken);

    const newRefreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.sessionService.createSession(
      user.id,
      newRefreshToken,
      (this.request.headers['user-agent'] as string) || 'unknown',
      (this.request.headers['x-forwarded-for'] as string) || this.request.socket?.remoteAddress || 'unknown',
      refreshExpiresAt,
    );

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async logout(refreshToken: string, accessToken?: string): Promise<{ success: boolean }> {
    try {
      if (refreshToken) {
        await this.sessionService.invalidateSession(refreshToken);
      }
      return { success: true };
    } catch (error) {
      this.logger.error('Logout failed', error instanceof Error ? error.stack : String(error));
      return { success: false };
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      }),
    );

    this.logger.log(`Password reset requested for ${email}. Token: ${token} (dev only)`);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.passwordResetTokenRepository.findOne({
      where: { token: dto.token },
      relations: ['user'],
    });
    if (!record || record.used || record.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.userRepository.update(record.user_id, { password_hash: hash });
    record.used = true;
    await this.passwordResetTokenRepository.save(record);

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const hash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.userRepository.update(userId, { password_hash: hash });
    return { message: 'Password has been changed successfully.' };
  }

  async createUser(dto: CreateUserDto, defaultRole: UserRole = UserRole.CUSTOMER): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = this.userRepository.create({
      email,
      password_hash: hash,
      role: dto.role ?? defaultRole,
    });
    return this.userRepository.save(user);
  }

  async findUserById(id: number): Promise<UserLite | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role'],
    });
    return user ? { id: user.id, email: user.email, role: user.role } : null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      select: ['id', 'email', 'password_hash', 'role', 'is_active'],
    });
  }

  async validateRefreshToken(token: string): Promise<UserLite | null> {
    const session = await this.sessionService.findSessionByToken(token);
    if (!session) return null;
    return this.findUserById(session.user_id);
  }

  private async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user || !user.is_active) return null;
    const valid = await bcrypt.compare(password, user.password_hash);
    return valid ? user : null;
  }
}
