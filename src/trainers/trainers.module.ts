// src/trainers/trainers.module.ts
import { Module } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { TrainersController } from './trainers.controller';
import { ClickhouseModule } from '../database/clickhouse.module';

@Module({
  imports: [ClickhouseModule],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}