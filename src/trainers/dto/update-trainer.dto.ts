import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';
import { CreateTrainerDto } from './create-trainer.dto';
import { TrainerSpecialization } from '../enums/trainer-specialization.enum';

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {
  @ApiProperty({ description: 'Whether the trainer is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
