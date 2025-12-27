import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieJwtGuard } from './guards/cookie-jwt.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('ACCESS_TOKEN_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    ClickhouseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieJwtGuard, RolesGuard],
  exports: [AuthService, JwtModule, CookieJwtGuard],
})
export class AuthModule {}
