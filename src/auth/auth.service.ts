import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../database/clickhouse.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
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

  /**
   * Normalize phone number by removing spaces, dashes, and other non-digit characters
   * Keeps only digits and leading + for country codes
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.trim();
    if (cleaned.startsWith('+')) {
      return '+' + cleaned.slice(1).replace(/\D/g, '');
    }
    return cleaned.replace(/\D/g, '');
  }

  /**
   * Escape single quotes for SQL injection prevention
   */
  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Check if phone number already exists - SIMPLE COUNT QUERY
   */
  private async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const escapedPhone = this.escapeSqlString(phone);
      // Use COUNT(*) instead of count() and let ClickHouse service add FORMAT
      const query = `SELECT COUNT(*) as cnt FROM fitpreeti.users WHERE phone = '${escapedPhone}'`;
      
      const result = await this.ch.query<Array<{ cnt: number }>>(query);
      
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
   * Check if email already exists - SIMPLE COUNT QUERY
   */
  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const escapedEmail = this.escapeSqlString(email);
      // Use COUNT(*) instead of count() and let ClickHouse service add FORMAT
      const query = `SELECT COUNT(*) as cnt FROM fitpreeti.users WHERE lower(trim(email)) = '${escapedEmail}'`;
      
      const result = await this.ch.query<Array<{ cnt: number }>>(query);
      
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
      // Normalize phone number
      const normalizedPhone = this.normalizePhone(dto.phone);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        throw new BadRequestException('Invalid phone number format');
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
        const normalizedEmail = dto.email.trim().toLowerCase();
        const emailExists = await this.checkEmailExists(normalizedEmail);
        if (emailExists) {
          this.logger.warn(`🚫 Duplicate email blocked: ${normalizedEmail}`);
          throw new ConflictException('Email already registered');
        }
      }

      // VALIDATE PIN
      if (!dto.pin || dto.pin.length < 4) {
        throw new BadRequestException('PIN must be at least 4 digits');
      }

      // HASH PIN before storing
      const hashedPin = await bcrypt.hash(dto.pin, this.saltRounds);

      // CREATE USER with UUID
      const role: UserRole = (dto.role as UserRole) || 'customer';
      const userId = uuidv4();

      const userData = {
        id: userId,
        name: dto.name.trim(),
        email: dto.email ? dto.email.trim().toLowerCase() : '',
        phone: normalizedPhone,
        pin: hashedPin, // Store hashed PIN
        role,
        created_at: new Date().toISOString(),
      };

      await this.ch.insert('users', userData);

      this.logger.log(`✅ User registered: ${normalizedPhone} (${role}) with ID: ${userId}`);
      
      return {
        success: true,
        message: 'User registered successfully',
        data: { id: userId, name: dto.name, email: dto.email || '', phone: normalizedPhone, role },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Registration failed', error);
      throw new ConflictException('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const normalizedPhone = this.normalizePhone(dto.phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new BadRequestException('Invalid phone number format');
    }

    const user = await this.validateUserCredentials(normalizedPhone, dto.pin);
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

    const normalizedPhone = this.normalizePhone(phone);
    const user = await this.findUserByPhonePublic(normalizedPhone);
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
    await this.createRefreshToken(normalizedPhone, newRefreshToken);

    const escapedToken = this.escapeSqlString(refreshToken);
    await this.ch.query(`ALTER TABLE fitpreeti.refresh_tokens DELETE WHERE token = '${escapedToken}'`);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  async logout(phone: string): Promise<{ success: boolean; message: string }> {
    await this.revokeUserTokens(phone);
    return { success: true, message: 'Logged out successfully' };
  }

  // 🔓 PUBLIC METHODS (for guards)
  public async findUserByPhonePublic(phone: string): Promise<UserLite | null> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      if (!normalizedPhone) {
        return null;
      }
      
      const escapedPhone = this.escapeSqlString(normalizedPhone);
      // Don't add FORMAT - ClickHouse service handles it automatically
      const query = `SELECT id, name, email, phone, role, created_at FROM fitpreeti.users WHERE phone = '${escapedPhone}' LIMIT 1`;
      
      const result = await this.ch.query<UserLite[]>(query);
      
      return result && Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.warn(`Public phone lookup failed: ${phone}`, error);
      return null;
    }
  }

  public async findUserById(id: string): Promise<UserLite | null> {
    try {
      const escapedId = this.escapeSqlString(id);
      // Don't add FORMAT - ClickHouse service handles it automatically
      const query = `SELECT id, name, email, phone, role, created_at FROM fitpreeti.users WHERE id = '${escapedId}' LIMIT 1`;
      
      const result = await this.ch.query<UserLite[]>(query);
      
      return result && Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.warn(`User lookup by ID failed: ${id}`, error);
      return null;
    }
  }

  public async validateRefreshToken(token: string): Promise<string | null> {
    try {
      const escapedToken = this.escapeSqlString(token);
      // Don't add FORMAT - ClickHouse service handles it automatically
      const query = `SELECT phone FROM fitpreeti.refresh_tokens WHERE token = '${escapedToken}' AND expires_at > now64() LIMIT 1`;
      
      const result = await this.ch.query<Array<{ phone: string }>>(query);
      
      return result && Array.isArray(result) && result.length > 0 ? result[0].phone : null;
    } catch (error) {
      this.logger.warn('Failed to validate refresh token', error);
      return null;
    }
  }

  // 🔒 PRIVATE METHODS
  private async findUserByPhone(phone: string): Promise<(UserLite & { pin?: string }) | null> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      if (!normalizedPhone) {
        return null;
      }
      
      const escapedPhone = this.escapeSqlString(normalizedPhone);
      // Don't add FORMAT - ClickHouse service handles it automatically
      const query = `SELECT id, name, email, phone, role, created_at, pin FROM fitpreeti.users WHERE phone = '${escapedPhone}' LIMIT 1`;
      
      const result = await this.ch.query<Array<UserLite & { pin?: string }>>(query);
      
      return result && Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error(`Phone lookup failed for ${phone}:`, error);
      throw error;
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

      return user as User;
    } catch (error) {
      this.logger.error(`Error validating credentials for ${phone}:`, error);
      return null;
    }
  }

  private async createRefreshToken(phone: string, refreshToken: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.ch.insert('refresh_tokens', {
      phone: normalizedPhone,
      token: refreshToken,
      expires_at: expiresAt,
    });
  }

  private async revokeUserTokens(phone: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    const escapedPhone = this.escapeSqlString(normalizedPhone);
    await this.ch.query(`ALTER TABLE fitpreeti.refresh_tokens DELETE WHERE phone = '${escapedPhone}'`);
  }
}
