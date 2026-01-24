import { Module } from '@nestjs/common';
import { TrainerPortalController } from './trainer-portal.controller';
import { SchedulesModule } from '../schedules/schedules.module';
import { TrainersModule } from '../trainers/trainers.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SchedulesModule, TrainersModule, AttendanceModule, AuthModule],
  controllers: [TrainerPortalController],
})
export class TrainerPortalModule {}
