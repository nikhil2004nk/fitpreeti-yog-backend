import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerSubscription } from './entities/customer-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { AuthModule } from '../auth/auth.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { ClassBookingsModule } from '../class-bookings/class-bookings.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerSubscription, Payment]),
    AuthModule,
    SchedulesModule,
    ClassBookingsModule,
    CustomersModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
