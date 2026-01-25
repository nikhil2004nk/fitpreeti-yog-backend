// src/class-schedule/dto/create-class-schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
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
  start_time: string;

  @ApiProperty({ description: 'End time of the class' })
  @IsDateString()
  end_time: string;

  @ApiProperty({ enum: ClassStatus, description: 'Status of the class', default: ClassStatus.SCHEDULED })
  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus = ClassStatus.SCHEDULED;

  @ApiProperty({ description: 'Maximum number of participants', default: 20 })
  @Min(1)
  @IsOptional()
  max_participants?: number = 20;

  @ApiProperty({ description: 'Current number of participants', default: 0 })
  @Min(0)
  @IsOptional()
  current_participants?: number = 0;

  @ApiProperty({ description: 'ID of the trainer' })
  @IsInt()
  trainer_id: number;

  @ApiProperty({ description: 'ID of the service' })
  @IsInt()
  service_id: number;

  @ApiProperty({ description: 'Whether this is a recurring class', default: false })
  @IsOptional()
  is_recurring?: boolean = false;

  @ApiProperty({ 
    description: 'Recurrence pattern (daily, weekly, monthly)',
    enum: ['daily', 'weekly', 'monthly'],
    required: false 
  })
  @IsOptional()
  @IsString()
  recurrence_pattern?: string;

  @ApiProperty({ 
    description: 'End date for recurring classes',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;
}