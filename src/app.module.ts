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
import { InstituteInfoModule } from './institute-info/institute-info.module';
import { ContentSectionsModule } from './content-sections/content-sections.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DatabaseModule } from './database/database.module';
import { validate } from './config/env.validation';

const isDevelopment = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isDevelopment ? '.env.development' : '.env',
      validate,
      cache: true,
    }),
    // Only import ThrottlerModule in production
    ...(isDevelopment ? [] : [
      ThrottlerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          // Increased limits for better user experience
          return [
            {
              ttl: 60000, // 1 minute
              limit: 1000, // 1000 requests per minute (increased from 100)
            },
            {
              name: 'auth',
              ttl: 900000, // 15 minutes
              limit: 30, // 30 requests per 15 minutes (increased from 5)
            },
          ];
        },
      }),
    ]),
    DatabaseModule,
    AuthModule,
    ServicesModule,
    BookingsModule,
    UsersModule,
    HealthModule,
    TrainersModule,
    ClassScheduleModule,
    ReviewsModule,
    InstituteInfoModule,
    ContentSectionsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Only register ThrottlerGuard in production
    ...(isDevelopment ? [] : [
      {
        provide: APP_GUARD,
        useFactory: (options: ThrottlerModuleOptions, storageService: ThrottlerStorage, reflector: Reflector) => {
          return new ThrottlerGuard(options, storageService, reflector);
        },
        inject: ['THROTTLER:MODULE_OPTIONS', ThrottlerStorage, Reflector],
      },
    ]),
  ],
})
export class AppModule {}