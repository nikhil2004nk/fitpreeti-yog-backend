import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../leads/entities/lead.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Customer, Trainer, Schedule, Payment]),
    AuthModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
