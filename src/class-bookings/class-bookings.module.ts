import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassBooking } from './entities/class-booking.entity';
import { ClassBookingsService } from './class-bookings.service';
import { ClassBookingsController } from './class-bookings.controller';
import { AuthModule } from '../auth/auth.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassBooking]),
    AuthModule,
    SchedulesModule,
    CustomersModule,
  ],
  providers: [ClassBookingsService],
  controllers: [ClassBookingsController],
  exports: [ClassBookingsService],
})
export class ClassBookingsModule {}
