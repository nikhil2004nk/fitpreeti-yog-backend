import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { User, UserLite, UserRole } from '../common/interfaces/user.interface';
import { SessionService } from './session.service';
import { normalizePhone, isValidPhone } from '../common/utils/phone.util';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number;
  private readonly database: string;

  constructor(
    private readonly ch: ClickhouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }

  /**
   * Check if phone number already exists using parameterized query
   */
  private async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const query = `SELECT COUNT(*) as cnt FROM ${this.database}.users WHERE phone = {phone:String}`;
      const result = await this.ch.queryParams<Array<{ cnt: number }>>(query, { phone });
      
      if (Array.isArray(result) && result.length > 0) {
        return result[0].cnt > 0;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error checking phone existence: ${phone}`, error);
      throw error;
    }
  }

  /**
   * Check if email already exists using parameterized query
   */
  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const query = `SELECT COUNT(*) as cnt FROM ${this.database}.users WHERE lower(trim(email)) = {email:String}`;
      const result = await this.ch.queryParams<Array<{ cnt: number }>>(query, { email: normalizedEmail });
      
      if (Array.isArray(result) && result.length > 0) {
        return result[0].cnt > 0;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error checking email existence: ${email}`, error);
      throw error;
    }
  }

  async register(dto: RegisterDto): Promise<{ success: boolean; message: string; data?: Partial<User> }> {
    try {
      // Sanitize and normalize inputs
      const normalizedPhone = normalizePhone(sanitizeText(dto.phone));
      if (!isValidPhone(normalizedPhone)) {
        throw new BadRequestException('Invalid phone number format. Must be at least 10 digits.');
      }

      this.logger.log(`🔍 Registering user with phone: ${normalizedPhone}`);
      
      // CHECK FOR DUPLICATE PHONE
      const phoneExists = await this.checkPhoneExists(normalizedPhone);
      if (phoneExists) {
        this.logger.warn(`🚫 Duplicate phone blocked: ${normalizedPhone}`);
        throw new ConflictException('Phone number already registered');
      }

      // CHECK FOR DUPLICATE EMAIL (if provided)
      if (dto.email) {
        const normalizedEmail = sanitizeText(dto.email).trim().toLowerCase();
        const emailExists = await this.checkEmailExists(normalizedEmail);
        if (emailExists) {
          this.logger.warn(`🚫 Duplicate email blocked: ${normalizedEmail}`);
          throw new ConflictException('Email already registered');
        }
      }

      // VALIDATE PIN - Improved validation (6-8 digits)
      if (!dto.pin || dto.pin.length < 6 || dto.pin.length > 8 || !/^\d+$/.test(dto.pin)) {
        throw new BadRequestException('PIN must be 6-8 digits');
      }

      // HASH PIN before storing
      const hashedPin = await bcrypt.hash(dto.pin, this.saltRounds);

      // CREATE USER with UUID
      const role: UserRole = (dto.role as UserRole) || 'customer';
      const userId = uuidv4();

      const userData = {
        id: userId,
        name: sanitizeText(dto.name).trim(),
        email: dto.email ? sanitizeText(dto.email).trim().toLowerCase() : '',
        phone: normalizedPhone,
        pin: hashedPin,
        role,
        profile_image: null,
        is_active: false,
        last_login: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.ch.insert('users', userData);

      this.logger.log(`✅ User registered: ${normalizedPhone} (${role}) with ID: ${userId}`);
      
      return {
        success: true,
        message: 'User registered successfully',
        data: { id: userId, name: userData.name, email: userData.email, phone: normalizedPhone, role },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Registration failed', error);
      throw new ConflictException('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: UserLite }> {
    const normalizedPhone = normalizePhone(sanitizeText(dto.phone));
    if (!isValidPhone(normalizedPhone)) {
      throw new BadRequestException('Invalid phone number format');
    }

    const user = await this.validateUserCredentials(normalizedPhone, dto.pin);
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or PIN');
    }

    const payload: JwtPayload = {
      sub: user.id?.toString() || '',
      phone: user.phone,
      email: user.email || '',
      name: user.name,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    // Generate refresh token (UUID-based for simplicity)
    const refreshToken = uuidv4();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days

    // Store refresh token in users table
    await this.updateUserRefreshToken(user.phone, refreshToken, refreshTokenExpiresAt);

    // Create session
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '900')));
    
    await this.sessionService.createSession(
      user.id || '',
      accessToken,
      this.request.headers['user-agent'] || 'unknown',
      (this.request.headers['x-forwarded-for'] as string) || this.request.socket.remoteAddress || 'unknown',
      expiresAt
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id || '',
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role as UserRole,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const phone = await this.validateRefreshToken(refreshToken);
    if (!phone) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await this.findUserByPhonePublic(normalizedPhone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id?.toString(),
      phone: user.phone,
      email: user.email || '',
      name: user.name,
      role: user.role as UserRole,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
    });

    // Generate new refresh token
    const newRefreshToken = uuidv4();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days

    // Update refresh token in users table
    await this.updateUserRefreshToken(normalizedPhone, newRefreshToken, refreshTokenExpiresAt);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async logout(refreshToken: string, accessToken?: string): Promise<{ success: boolean }> {
    try {
      // Clear refresh token from users table
      if (refreshToken) {
        const phone = await this.validateRefreshToken(refreshToken);
        if (phone) {
          await this.clearUserRefreshToken(phone);
        }
      }

      // Invalidate the session if access token is provided
      if (accessToken) {
        await this.sessionService.invalidateSession(accessToken);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error('Logout failed', error instanceof Error ? error.stack : String(error));
      return { success: false };
    }
  }

  public async findUserById(id: string): Promise<UserLite | null> {
    try {
      const query = `
        SELECT id, name, email, phone as phone, role, created_at
        FROM ${this.database}.users 
        WHERE id = {id:String}
        LIMIT 1
      `;
      
      const result = await this.ch.queryParams<UserLite[]>(query, { id });
      return result?.[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${id}`, error);
      return null;
    }
  }

  private async findUserByPhone(phone: string): Promise<User | null> {
    try {
      const query = `
        SELECT 
          id,
          name,
          email,
          phone,
          pin,
          role,
          created_at
        FROM ${this.database}.users 
        WHERE phone = {phone:String}
        LIMIT 1
      `;
      
      const result = await this.ch.queryParams<User[]>(query, { phone });
      return result?.[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by phone: ${phone}`, error);
      return null;
    }
  }

  public async findUserByPhonePublic(phone: string): Promise<UserLite | null> {
    try {
      const query = `
        SELECT id, name, email, phone, role, created_at 
        FROM ${this.database}.users 
        WHERE phone = {phone:String}
        LIMIT 1
      `;
      
      const result = await this.ch.queryParams<UserLite[]>(query, { phone });
      return result?.[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by phone (public): ${phone}`, error);
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

    if (!user.pin) {
      this.logger.warn(`No PIN stored for user: ${phone}`);
      return null;
    }

    // Compare provided PIN with hashed PIN
    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      this.logger.warn(`Invalid PIN for user: ${phone}`);
      return null;
    }

    // Get current timestamp in correct format for ClickHouse
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').replace('Z', '');
    
    // Update is_active and last_login using parameterized query
    // Note: ClickHouse parameterized queries don't support all functions, so we use a hybrid approach
    const updateQuery = `
      ALTER TABLE ${this.database}.users 
      UPDATE 
        is_active = true, 
        last_login = parseDateTime64BestEffort({date:String})
      WHERE phone = {phone:String}
    `;
    await this.ch.queryParams(updateQuery, { phone, date: formattedDate });

    // Return updated user data
    return {
      ...user,
      is_active: true,
      last_login: now.toISOString()
    };
  } catch (error) {
    this.logger.error(`Error validating user credentials for phone: ${phone}`, error);
    return null;
  }
}

  public async validateRefreshToken(token: string): Promise<string | null> {
    try {
      const query = `
        SELECT phone 
        FROM ${this.database}.users 
        WHERE refresh_token = {token:String}
          AND refresh_token_expires_at > now()
          AND is_active = true
        LIMIT 1
      `;
      
      const result = await this.ch.queryParams<Array<{ phone: string }>>(query, { token });
      return result?.[0]?.phone || null;
    } catch (error) {
      this.logger.error('Error validating refresh token', error);
      return null;
    }
  }

  private async updateUserRefreshToken(phone: string, refreshToken: string, expiresAt: Date): Promise<void> {
    try {
      const normalizedPhone = normalizePhone(phone);
      const expiresAtStr = expiresAt.toISOString();
      
      const updateQuery = `
        ALTER TABLE ${this.database}.users 
        UPDATE 
          refresh_token = {token:String},
          refresh_token_expires_at = parseDateTime64BestEffort({expiresAt:String}),
          updated_at = now64()
        WHERE phone = {phone:String}
      `;
      
      await this.ch.queryParams(updateQuery, { 
        phone: normalizedPhone, 
        token: refreshToken,
        expiresAt: expiresAtStr
      });
    } catch (error) {
      this.logger.error(`Error updating refresh token for phone: ${phone}`, error);
      throw error;
    }
  }

  private async clearUserRefreshToken(phone: string): Promise<void> {
    try {
      const normalizedPhone = normalizePhone(phone);
      
      const updateQuery = `
        ALTER TABLE ${this.database}.users 
        UPDATE 
          refresh_token = NULL,
          refresh_token_expires_at = NULL,
          updated_at = now64()
        WHERE phone = {phone:String}
      `;
      
      await this.ch.queryParams(updateQuery, { phone: normalizedPhone });
    } catch (error) {
      this.logger.error(`Error clearing refresh token for phone: ${phone}`, error);
    }
  }
}
