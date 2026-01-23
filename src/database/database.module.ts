import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { Service } from '../services/entities/service.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ClassSchedule } from '../class-schedule/entities/class-schedule.entity';
import { Review } from '../reviews/entities/review.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { InstituteInfo } from '../institute-info/entities/institute-info.entity';
import { ContentSection } from '../content-sections/entities/content-section.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME', 'fitpreeti_dev'),
        entities: [
          User,
          Trainer,
          Service,
          Booking,
          ClassSchedule,
          Review,
          Attendance,
          InstituteInfo,
          ContentSection,
        ],
        synchronize: true, // Auto-create tables (starting from scratch)
        logging: configService.get('NODE_ENV') === 'development',
        timezone: configService.get('TZ', 'Asia/Kolkata'),
        charset: 'utf8mb4',
        extra: {
          connectionLimit: 10,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

