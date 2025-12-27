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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("../auth.service");
let CookieJwtGuard = class CookieJwtGuard {
    jwtService;
    configService;
    authService;
    constructor(jwtService, configService, authService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.authService = authService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        let token = request.cookies?.['access_token'];
        if (!token) {
            throw new common_1.UnauthorizedException('No access token provided');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            request.user = payload;
            return true;
        }
        catch {
            const refreshToken = request.cookies?.['refresh_token'];
            if (!refreshToken) {
                throw new common_1.UnauthorizedException('Session expired');
            }
            try {
                const phone = await this.authService.validateRefreshToken(refreshToken);
                if (!phone) {
                    throw new common_1.UnauthorizedException('Invalid refresh token');
                }
                const user = await this.authService.findUserByPhonePublic(phone);
                if (!user) {
                    throw new common_1.UnauthorizedException('User not found');
                }
                const newPayload = {
                    sub: user.id?.toString(),
                    phone: user.phone,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
                const newAccessToken = this.jwtService.sign(newPayload, {
                    expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN') || '15m'
                });
                request.user = newPayload;
                response.cookie('access_token', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 15 * 60 * 1000,
                });
                return true;
            }
            catch {
                throw new common_1.UnauthorizedException('Authentication failed');
            }
        }
    }
};
exports.CookieJwtGuard = CookieJwtGuard;
exports.CookieJwtGuard = CookieJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        auth_service_1.AuthService])
], CookieJwtGuard);
//# sourceMappingURL=cookie-jwt.guard.js.map