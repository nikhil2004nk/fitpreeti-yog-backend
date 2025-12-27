"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const clickhouse_service_1 = require("../database/clickhouse.service");
const uuid_1 = require("uuid");
let AuthService = AuthService_1 = class AuthService {
    ch;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    saltRounds = 12;
    constructor(ch, jwtService, configService) {
        this.ch = ch;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        try {
            const existingPhone = await this.findUserByPhone(dto.phone);
            if (existingPhone) {
                this.logger.warn(`🚫 Duplicate phone blocked: ${dto.phone}`);
                throw new common_1.ConflictException('Phone number already registered');
            }
            if (dto.email) {
                const existingEmail = await this.findUserByEmail(dto.email);
                if (existingEmail) {
                    throw new common_1.ConflictException('Email already registered');
                }
            }
            if (!dto.pin || dto.pin.length < 4) {
                throw new common_1.BadRequestException('PIN must be at least 4 digits');
            }
            const role = dto.role || 'customer';
            const userData = {
                name: dto.name,
                email: dto.email || '',
                phone: dto.phone,
                pin: dto.pin,
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Registration failed', error);
            throw new common_1.ConflictException('Registration failed');
        }
    }
    async login(dto) {
        const user = await this.validateUserCredentials(dto.phone, dto.pin);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid phone number or PIN');
        }
        const payload = {
            sub: user.id?.toString(),
            phone: user.phone,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
        });
        const refreshToken = (0, uuid_1.v4)();
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
    async refresh(refreshToken) {
        const phone = await this.validateRefreshToken(refreshToken);
        if (!phone) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.findUserByPhonePublic(phone);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const payload = {
            sub: user.id?.toString(),
            phone: user.phone,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        const newAccessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
        });
        const newRefreshToken = (0, uuid_1.v4)();
        await this.createRefreshToken(phone, newRefreshToken);
        await this.ch.query(`ALTER TABLE fitpreeti.refresh_tokens DELETE WHERE token = '${refreshToken.replace(/'/g, "''")}'`);
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }
    async logout(phone) {
        await this.revokeUserTokens(phone);
        return { success: true, message: 'Logged out successfully' };
    }
    async findUserByPhonePublic(phone) {
        try {
            const result = await this.ch.query(`SELECT id, name, email, phone, role, created_at 
         FROM fitpreeti.users 
         WHERE phone = '${phone.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`);
            return result && result.length ? result[0] : null;
        }
        catch (error) {
            this.logger.warn(`Public phone lookup failed: ${phone}`, error);
            return null;
        }
    }
    async validateRefreshToken(token) {
        try {
            const result = await this.ch.query(`SELECT phone 
         FROM fitpreeti.refresh_tokens 
         WHERE token = '${token.replace(/'/g, "''")}'
           AND expires_at > now64()
         LIMIT 1
         FORMAT JSONEachRow`);
            return result && result.length ? result[0].phone : null;
        }
        catch (error) {
            this.logger.warn('Failed to validate refresh token', error);
            return null;
        }
    }
    async findUserByPhone(phone) {
        try {
            const result = await this.ch.query(`SELECT id, name, email, phone, role, created_at, pin 
         FROM fitpreeti.users 
         WHERE phone = '${phone.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`);
            return result && result.length ? result[0] : null;
        }
        catch (error) {
            this.logger.warn(`Phone lookup failed: ${phone}`, error);
            return null;
        }
    }
    async findUserByEmail(email) {
        try {
            const result = await this.ch.query(`SELECT id, name, email, phone, role, created_at
         FROM fitpreeti.users 
         WHERE email = '${email.replace(/'/g, "''")}'
         LIMIT 1
         FORMAT JSONEachRow`);
            return result && result.length ? result[0] : null;
        }
        catch (error) {
            this.logger.warn(`Email lookup failed: ${email}`, error);
            return null;
        }
    }
    async validateUserCredentials(phone, pin) {
        try {
            const user = await this.findUserByPhone(phone);
            if (!user) {
                this.logger.warn(`User not found for phone: ${phone}`);
                return null;
            }
            if (user.pin !== pin) {
                this.logger.warn(`Invalid PIN for user: ${phone}`);
                return null;
            }
            return user;
        }
        catch (error) {
            this.logger.error(`Error validating credentials for ${phone}:`, error);
            return null;
        }
    }
    async createRefreshToken(phone, refreshToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await this.ch.insert('refresh_tokens', {
            phone: phone.replace(/'/g, "''"),
            token: refreshToken,
            expires_at: expiresAt,
        });
    }
    async revokeUserTokens(phone) {
        await this.ch.query(`ALTER TABLE fitpreeti.refresh_tokens DELETE WHERE phone = '${phone.replace(/'/g, "''")}'`);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map