import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { User, UserLite } from '../common/interfaces/user.interface';

type UserRole = 'customer' | 'admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly ch: ClickhouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ success: boolean; message: string; data?: Partial<User> }> {
    try {
      // STRICT PHONE DUPLICATE CHECK
      const existingPhone = await this.findUserByPhone(dto.phone);
      if (existingPhone) {
        this.logger.warn(`🚫 Duplicate phone blocked: ${dto.phone}`);
        throw new ConflictException('Phone number already registered');
      }

      // EMAIL CHECK (optional)
      if (dto.email) {
        const existingEmail = await this.findUserByEmail(dto.email);
        if (existingEmail) {
          throw new ConflictException('Email already registered');
        }
      }

      // VALIDATE PIN
      if (!dto.pin || dto.pin.length < 4) {
        throw new BadRequestException('PIN must be at least 4 digits');
      }

      // CREATE USER
      const role: UserRole = (dto.role as UserRole) || 'customer';

      const userData = {
        name: dto.name,
        email: dto.email || '',
        phone: dto.phone,
        pin: dto.pin, // Store plain PIN for now (in a real app, this should be hashed)
        role,
        created_at: new Date().toISOString(),
      };

      await this.ch.insert('users', userData);

      this.logger.log(`✅ User registered: ${dto.phone} (${role})`);
      
      return {
        success: true,
        message: 'User registered successfully',
        data: { name: dto.name, email: dto.email || '', phone: dto.phone, role },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Registration failed', error);
      throw new ConflictException('Registration failed');
    }
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const user = await this.validateUserCredentials(dto.phone, dto.pin);
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or PIN');
    }

    const payload: JwtPayload = {
      sub: user.id?.toString(),
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4();
    await this.createRefreshToken(user.phone, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const phone = await this.validateRefreshToken(refreshToken);
    if (!phone) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.findUserByPhonePublic(phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id?.toString(),
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    const newRefreshToken = uuidv4();
    await this.createRefreshToken(phone, newRefreshToken);

    await this.ch.query(`ALTER TABLE fitpreeti.refresh_tokens DELETE WHERE token = '${refreshToken.replace(/'/g, "''")}'`);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async logout(phone: string): Promise<{ success: boolean; message: string }> {
    await this.revokeUserTokens(phone);
    return { success: true, message: 'Logged out successfully' };
  }

  // 🔓 PUBLIC METHODS (for guards)
  public async findUserByPhonePublic(phone: string): Promise<UserLite | null> {
    try {
      const result = await this.ch.query(
        `SELECT id, name, email, phone, role, created_at 
         FROM fitpreeti.users 
         WHERE phone = '${phone.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`
      ) as unknown as UserLite[];
      
      return result && result.length ? result[0] : null;
    } catch (error) {
      this.logger.warn(`Public phone lookup failed: ${phone}`, error);
      return null;
    }
  }

  public async validateRefreshToken(token: string): Promise<string | null> {
    try {
      const result = await this.ch.query(
        `SELECT phone 
         FROM fitpreeti.refresh_tokens 
         WHERE token = '${token.replace(/'/g, "''")}'
           AND expires_at > now64()
         LIMIT 1`
      ) as unknown as Array<{ phone: string }>;
      
      return result && result.length ? result[0].phone : null;
    } catch (error) {
      this.logger.warn('Failed to validate refresh token', error);
      return null;
    }
  }

  // 🔒 PRIVATE METHODS
  private async findUserByPhone(phone: string): Promise<(UserLite & { pin?: string }) | null> {
    try {
      const result = await this.ch.query(
        `SELECT id, name, email, phone, role, created_at, pin 
         FROM fitpreeti.users 
         WHERE phone = '${phone.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`
      ) as unknown as Array<UserLite & { pin?: string }>;
      
      return result && result.length ? result[0] : null;
    } catch (error) {
      this.logger.warn(`Phone lookup failed: ${phone}`, error);
      return null;
    }
  }

  private async findUserByEmail(email: string): Promise<UserLite | null> {
    try {
      const result = await this.ch.query(
        `SELECT id, name, email, phone, role, created_at
         FROM fitpreeti.users 
         WHERE email = '${email.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`
      ) as unknown as UserLite[];
      
      return result && result.length ? result[0] : null;
    } catch (error) {
      this.logger.warn(`Email lookup failed: ${email}`, error);
      return null;
    }
  }

  private async validateUserCredentials(phone: string, pin: string): Promise<User | null> {
    try {
      const user = await this.findUserByPhone(phone);
      if (!user) {
        this.logger.warn(`User not found for phone: ${phone}`);
        return null;
      }

      // Compare plain PIN (in a real app, use bcrypt.compare with hashed PIN)
      if (user.pin !== pin) {
        this.logger.warn(`Invalid PIN for user: ${phone}`);
        return null;
      }

      return user as User;
    } catch (error) {
      this.logger.error(`Error validating credentials for ${phone}:`, error);
      return null;
    }
  }

  private async createRefreshToken(phone: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.ch.insert('refresh_tokens', {
      phone: phone.replace(/'/g, "''"),
      token: refreshToken,
      expires_at: expiresAt,
    });
  }

  private async revokeUserTokens(phone: string): Promise<void> {
    await this.ch.query(`ALTER TABLE fi