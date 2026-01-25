// src/class-schedule/dto/class-schedule-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ClassStatus } from '../entities/class-schedule.entity';

export class ClassScheduleResponseDto {
  @ApiProperty({ description: 'Unique identifier of the class' })
  id: string;

  @ApiProperty({ description: 'Title of the class' })
  title: string;

  @ApiProperty({ description: 'Description of the class', required: false })
  description?: string;

  @ApiProperty({ description: 'Start time of the class' })
  start_time: string;

  @ApiProperty({ description: 'End time of the class' })
  end_time: string;

  @ApiProperty({ enum: ClassStatus, description: 'Status of the class' })
  status: ClassStatus;

  @ApiProperty({ description: 'Maximum number of participants' })
  max_participants: number;

  @ApiProperty({ description: 'Current number of participants' })
  current_participants: number;

  @ApiProperty({ description: 'ID of the trainer' })
  trainer_id: number;

  @ApiProperty({ description: 'ID of the service' })
  service_id: number;

  @ApiProperty({ description: 'Whether this is a recurring class' })
  is_recurring: boolean;

  @ApiProperty({ 
    description: 'Recurrence pattern (daily, weekly, monthly)',
    enum: ['daily', 'weekly', 'monthly'],
    required: false 
  })
  recurrence_pattern?: string;

  @ApiProperty({ 
    description: 'End date for recurring classes',
    required: false 
  })
  recurrence_end_date?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;
}