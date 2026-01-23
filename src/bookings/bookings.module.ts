import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { ClassScheduleModule } from '../class-schedule/class-schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Service]),
    AuthModule,
    ServicesModule,
    ClassScheduleModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
