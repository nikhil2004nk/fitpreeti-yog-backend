import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CookieJwtGuard } from './guards/cookie-jwt.guard';
import { SessionService } from './session.service';

@Module({
  imports: [
    ClickhouseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '1h') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    CookieJwtGuard,
    SessionService,
  ],
  controllers: [AuthController],
  exports: [
    JwtModule,  // Export JwtModule to make JwtService available
    AuthService, 
    CookieJwtGuard, 
    SessionService
  ],
})
export class AuthModule {}
