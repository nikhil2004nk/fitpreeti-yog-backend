// src/class-schedule/class-schedule.module.ts
import { Module } from '@nestjs/common';
import { ClassScheduleService } from './class-schedule.service';
import { ClassScheduleController } from './class-schedule.controller';
import { TrainersModule } from '../trainers/trainers.module';
import { ServicesModule } from '../services/services.module';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClickhouseModule, 
    TrainersModule, 
    ServicesModule,
    AuthModule
  ],
  controllers: [ClassScheduleController],
  providers: [ClassScheduleService],
  exports: [ClassScheduleService],
})
export class ClassScheduleModule {}