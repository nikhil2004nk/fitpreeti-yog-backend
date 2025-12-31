"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const clickhouse_service_1 = require("../database/clickhouse.service");
const uuid_1 = require("uuid");
const bcrypt = __importStar(require("bcrypt"));
const core_1 = require("@nestjs/core");
const session_service_1 = require("./session.service");
const phone_util_1 = require("../common/utils/phone.util");
const sanitize_util_1 = require("../common/utils/sanitize.util");
let AuthService = AuthService_1 = class AuthService {
    ch;
    jwtService;
    configService;
    sessionService;
    request;
    logger = new common_1.Logger(AuthService_1.name);
    saltRounds;
    database;
    constructor(ch, jwtService, configService, sessionService, request) {
        this.ch = ch;
        this.jwtService = jwtService;
        this.configService = configService;
        this.sessionService = sessionService;
        this.request = request;
        this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
        this.saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
    }
    async checkPhoneExists(phone) {
        try {
            const query = `SELECT COUNT(*) as cnt FROM ${this.database}.users WHERE phone = {phone:String}`;
            const result = await this.ch.queryParams(query, { phone });
            if (Array.isArray(result) && result.length > 0) {
                return result[0].cnt > 0;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Error checking phone existence: ${phone}`, error);
            throw error;
        }
    }
    async checkEmailExists(email) {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const query = `SELECT COUNT(*) as cnt FROM ${this.database}.users WHERE lower(trim(email)) = {email:String}`;
            const result = await this.ch.queryParams(query, { email: normalizedEmail });
            if (Array.isArray(result) && result.length > 0) {
                return result[0].cnt > 0;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Error checking email existence: ${email}`, error);
            throw error;
        }
    }
    async register(dto) {
        try {
            const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(dto.phone));
            if (!(0, phone_util_1.isValidPhone)(normalizedPhone)) {
                throw new common_1.BadRequestException('Invalid phone number format. Must be at least 10 digits.');
            }
            this.logger.log(`🔍 Registering user with phone: ${normalizedPhone}`);
            const phoneExists = await this.checkPhoneExists(normalizedPhone);
            if (phoneExists) {
                this.logger.warn(`🚫 Duplicate phone blocked: ${normalizedPhone}`);
                throw new common_1.ConflictException('Phone number already registered');
            }
            if (dto.email) {
                const normalizedEmail = (0, sanitize_util_1.sanitizeText)(dto.email).trim().toLowerCase();
                const emailExists = await this.checkEmailExists(normalizedEmail);
                if (emailExists) {
                    this.logger.warn(`🚫 Duplicate email blocked: ${normalizedEmail}`);
                    throw new common_1.ConflictException('Email already registered');
                }
            }
            if (!dto.pin || dto.pin.length < 6 || dto.pin.length > 8 || !/^\d+$/.test(dto.pin)) {
                throw new common_1.BadRequestException('PIN must be 6-8 digits');
            }
            const hashedPin = await bcrypt.hash(dto.pin, this.saltRounds);
            const role = dto.role || 'customer';
            const userId = (0, uuid_1.v4)();
            const userData = {
                id: userId,
                name: (0, sanitize_util_1.sanitizeText)(dto.name).trim(),
                email: dto.email ? (0, sanitize_util_1.sanitizeText)(dto.email).trim().toLowerCase() : '',
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Registration failed', error);
            throw new common_1.ConflictException('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }
    async login(dto) {
        const normalizedPhone = (0, phone_util_1.normalizePhone)((0, sanitize_util_1.sanitizeText)(dto.phone));
        if (!(0, phone_util_1.isValidPhone)(normalizedPhone)) {
            throw new common_1.BadRequestException('Invalid phone number format');
        }
        const user = await this.validateUserCredentials(normalizedPhone, dto.pin);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid phone number or PIN');
        }
        const payload = {
            sub: user.id?.toString() || '',
            phone: user.phone,
            email: user.email || '',
            name: user.name,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
        });
        const refreshToken = (0, uuid_1.v4)();
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
        await this.updateUserRefreshToken(user.phone, refreshToken, refreshTokenExpiresAt);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '900')));
        await this.sessionService.createSession(user.id || '', accessToken, this.request.headers['user-agent'] || 'unknown', this.request.headers['x-forwarded-for'] || this.request.socket.remoteAddress || 'unknown', expiresAt);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id || '',
                name: user.name,
                email: user.email || '',
                phone: user.phone,
                role: user.role,
            },
        };
    }
    async refresh(refreshToken) {
        const phone = await this.validateRefreshToken(refreshToken);
        if (!phone) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const normalizedPhone = (0, phone_util_1.normalizePhone)(phone);
        const user = await this.findUserByPhonePublic(normalizedPhone);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const payload = {
            sub: user.id?.toString(),
            phone: user.phone,
            email: user.email || '',
            name: user.name,
            role: user.role,
        };
        const newAccessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m'),
        });
        const newRefreshToken = (0, uuid_1.v4)();
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
        await this.updateUserRefreshToken(normalizedPhone, newRefreshToken, refreshTokenExpiresAt);
        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }
    async logout(refreshToken, accessToken) {
        try {
            if (refreshToken) {
                const phone = await this.validateRefreshToken(refreshToken);
                if (phone) {
                    await this.clearUserRefreshToken(phone);
                }
            }
            if (accessToken) {
                await this.sessionService.invalidateSession(accessToken);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error('Logout failed', error instanceof Error ? error.stack : String(error));
            return { success: false };
        }
    }
    async findUserById(id) {
        try {
            const query = `
        SELECT id, name, email, phone as phone, role, created_at
        FROM ${this.database}.users 
        WHERE id = {id:String}
        LIMIT 1
      `;
            const result = await this.ch.queryParams(query, { id });
            return result?.[0] || null;
        }
        catch (error) {
            this.logger.error(`Error finding user by ID: ${id}`, error);
            return null;
        }
    }
    async findUserByPhone(phone) {
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
            const result = await this.ch.queryParams(query, { phone });
            return result?.[0] || null;
        }
        catch (error) {
            this.logger.error(`Error finding user by phone: ${phone}`, error);
            return null;
        }
    }
    async findUserByPhonePublic(phone) {
        try {
            const query = `
        SELECT id, name, email, phone, role, created_at 
        FROM ${this.database}.users 
        WHERE phone = {phone:String}
        LIMIT 1
      `;
            const result = await this.ch.queryParams(query, { phone });
            return result?.[0] || null;
        }
        catch (error) {
            this.logger.error(`Error finding user by phone (public): ${phone}`, error);
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
            if (!user.pin) {
                this.logger.warn(`No PIN stored for user: ${phone}`);
                return null;
            }
            const isPinValid = await bcrypt.compare(pin, user.pin);
            if (!isPinValid) {
                this.logger.warn(`Invalid PIN for user: ${phone}`);
                return null;
            }
            const now = new Date();
            const formattedDate = now.toISOString().replace('T', ' ').replace('Z', '');
            const updateQuery = `
      ALTER TABLE ${this.database}.users 
      UPDATE 
        is_active = true, 
        last_login = parseDateTime64BestEffort({date:String})
      WHERE phone = {phone:String}
    `;
            await this.ch.queryParams(updateQuery, { phone, date: formattedDate });
            return {
                ...user,
                is_active: true,
                last_login: now.toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error validating user credentials for phone: ${phone}`, error);
            return null;
        }
    }
    async validateRefreshToken(token) {
        try {
            const query = `
        SELECT phone 
        FROM ${this.database}.users 
        WHERE refresh_token = {token:String}
          AND refresh_token_expires_at > now()
          AND is_active = true
        LIMIT 1
      `;
            const result = await this.ch.queryParams(query, { token });
            return result?.[0]?.phone || null;
        }
        catch (error) {
            this.logger.error('Error validating refresh token', error);
            return null;
        }
    }
    async updateUserRefreshToken(phone, refreshToken, expiresAt) {
        try {
            const normalizedPhone = (0, phone_util_1.normalizePhone)(phone);
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
        }
        catch (error) {
            this.logger.error(`Error updating refresh token for phone: ${phone}`, error);
            throw error;
        }
    }
    async clearUserRefreshToken(phone) {
        try {
            const normalizedPhone = (0, phone_util_1.normalizePhone)(phone);
            const updateQuery = `
        ALTER TABLE ${this.database}.users 
        UPDATE 
          refresh_token = NULL,
          refresh_token_expires_at = NULL,
          updated_at = now64()
        WHERE phone = {phone:String}
      `;
            await this.ch.queryParams(updateQuery, { phone: normalizedPhone });
        }
        catch (error) {
            this.logger.error(`Error clearing refresh token for phone: ${phone}`, error);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [clickhouse_service_1.ClickhouseService,
        jwt_1.JwtService,
        config_1.ConfigService,
        session_service_1.SessionService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map