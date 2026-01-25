// src/trainers/trainers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from './entities/trainer.entity';
import { TrainersService } from './trainers.service';
import { TrainersController } from './trainers.controller';
import { TrainersPublicController } from './trainers-public.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trainer]),
    AuthModule, // Add AuthModule to use guards
  ],
  controllers: [TrainersController, TrainersPublicController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}