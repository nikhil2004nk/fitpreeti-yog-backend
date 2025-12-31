// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerStorage, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { TrainersModule } from './trainers/trainers.module';
import { ClassScheduleModule } from './class-schedule/class-schedule.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ClickhouseModule } from './database/clickhouse.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isDevelopment = nodeEnv === 'development';
        
        // Higher limits for development, stricter for production
        return [
          {
            ttl: 60000, // 1 minute
            limit: isDevelopment ? 1000 : 100, // 1000 requests per minute in dev, 100 in prod
          },
          {
            name: 'auth',
            ttl: 900000, // 15 minutes
            limit: isDevelopment ? 20 : 5, // 20 requests per 15 minutes in dev, 5 in prod
          },
        ];
      },
    }),
    ClickhouseModule,
    AuthModule,
    ServicesModule,
    BookingsModule,
    UsersModule,
    HealthModule,
    TrainersModule,
    ClassScheduleModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (options: ThrottlerModuleOptions, storageService: ThrottlerStorage, reflector: Reflector) => {
        return new ThrottlerGuard(options, storageService, reflector);
      },
      inject: ['THROTTLER:MODULE_OPTIONS', ThrottlerStorage, Reflector],
    },
  ],
})
export class AppModule {}