// src/trainers/trainers.module.ts
import { Module } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { TrainersController } from './trainers.controller';
import { ClickhouseModule } from '../database/clickhouse.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClickhouseModule,
    AuthModule, // Add AuthModule to use guards
  ],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}