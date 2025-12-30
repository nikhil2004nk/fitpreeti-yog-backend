// src/class-schedule/dto/create-class-schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ClassStatus } from '../entities/class-schedule.entity';

export class CreateClassScheduleDto {
  @ApiProperty({ description: 'Title of the class' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the class', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Start time of the class' })
  @IsDateString()
  startTime: Date | string;

  @ApiProperty({ description: 'End time of the class' })
  @IsDateString()
  endTime: Date | string;

  @ApiProperty({ description: 'Maximum number of participants', default: 20 })
  @Min(1)
  maxParticipants?: number;

  @ApiProperty({ description: 'ID of the trainer' })
  @IsUUID()
  trainerId: string;

  @ApiProperty({ description: 'ID of the service' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Whether this is a recurring class', default: false })
  isRecurring?: boolean;

  @ApiProperty({ 
    description: 'Recurrence pattern (daily, weekly, monthly)',
    enum: ['daily', 'weekly', 'monthly'],
    required: false 
  })
  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @ApiProperty({ 
    description: 'End date for recurring classes',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: Date | string;
}