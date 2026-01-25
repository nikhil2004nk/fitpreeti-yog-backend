import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { TrainerAvailability } from '../trainers/entities/trainer-availability.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceOption } from '../services/entities/service-option.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadActivity } from '../leads/entities/lead-activity.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleException } from '../schedules/entities/schedule-exception.entity';
import { CustomerSubscription } from '../subscriptions/entities/customer-subscription.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { InstituteInfo } from '../institute-info/entities/institute-info.entity';
import { ContentSection } from '../content-sections/entities/content-section.entity';
import { UserSession } from '../auth/entities/user-session.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Review } from '../reviews/entities/review.entity';
import { ClassSchedule } from '../class-schedule/entities/class-schedule.entity';

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
          PasswordResetToken,
          Trainer,
          TrainerAvailability,
          Service,
          ServiceOption,
          ClassSchedule,
          Booking,
          Review,
          Lead,
          LeadActivity,
          Customer,
          Schedule,
          ScheduleException,
          CustomerSubscription,
          Attendance,
          Payment,
          Notification,
          AppSetting,
          AuditLog,
          InstituteInfo,
          ContentSection,
          UserSession,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
        timezone: configService.get('TZ', '+05:30'),
        charset: 'utf8mb4',
        extra: { connectionLimit: 10 },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
