import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomersModule } from '../customers/customers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CustomersModule, SubscriptionsModule, AttendanceModule, AuthModule],
  controllers: [CustomerPortalController],
})
export class CustomerPortalModule {}
