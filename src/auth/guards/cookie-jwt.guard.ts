import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { UserRole } from '../../common/interfaces/user.interface';

@Injectable()
export class CookieJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    let token = request.cookies?.['access_token'];
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      request.user = payload;
      return true;
    } catch {
      // Token expired - try refresh
      const refreshToken = request.cookies?.['refresh_token'];
      if (!refreshToken) {
        throw new UnauthorizedException('Session expired');
      }

      try {
        // Validate refresh token from database
        const phone = await this.authService.validateRefreshToken(refreshToken);
        if (!phone) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.authService.findUserByPhonePublic(phone);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        // ✅ FIXED: Proper UserRole casting
        const newPayload: JwtPayload = { 
          sub: user.id?.toString(),
          phone: user.phone, 
          email: user.email,
          name: user.name,
          role: (user.role as UserRole) // Type assertion fix
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
      } catch {
        throw new UnauthorizedException('Authentication failed');
      }
    }
  }
}
