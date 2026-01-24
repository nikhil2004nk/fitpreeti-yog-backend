import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

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

    const token = request.cookies?.['access_token'];
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
      const refreshToken = request.cookies?.['refresh_token'];
      if (!refreshToken) {
        throw new UnauthorizedException('Session expired');
      }

      try {
        const user = await this.authService.validateRefreshToken(refreshToken);
        if (!user) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        const newPayload: JwtPayload = {
          sub: String(user.id),
          email: user.email,
          role: user.role,
        };

        const newAccessToken = this.jwtService.sign(newPayload, {
          expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN') || '15m',
        });

        request.user = newPayload;
        const isProduction = process.env.NODE_ENV === 'production';
        response.cookie('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? ('none' as const) : ('strict' as const),
          path: '/',
          maxAge: 15 * 60 * 1000,
        });
        return true;
      } catch {
        throw new UnauthorizedException('Authentication failed');
      }
    }
  }
}
