// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { TrainersModule } from './trainers/trainers.module';
import { ClassScheduleModule } from './class-schedule/class-schedule.module';
import { ClickhouseModule } from './database/clickhouse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClickhouseModule,
    AuthModule,
    ServicesModule,
    BookingsModule,
    UsersModule,
    HealthModule,
    TrainersModule,
    ClassScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}