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
  startTime: string;

  @ApiProperty({ description: 'End time of the class' })
  endTime: string;

  @ApiProperty({ enum: ClassStatus, description: 'Status of the class' })
  status: ClassStatus;

  @ApiProperty({ description: 'Maximum number of participants' })
  maxParticipants: number;

  @ApiProperty({ description: 'Current number of participants' })
  currentParticipants: number;

  @ApiProperty({ description: 'ID of the trainer' })
  trainerId: string;

  @ApiProperty({ description: 'ID of the service' })
  serviceId: string;

  @ApiProperty({ description: 'Whether this is a recurring class' })
  isRecurring: boolean;

  @ApiProperty({ 
    description: 'Recurrence pattern (daily, weekly, monthly)',
    enum: ['daily', 'weekly', 'monthly'],
    required: false 
  })
  recurrencePattern?: string;

  @ApiProperty({ 
    description: 'End date for recurring classes',
    required: false 
  })
  recurrenceEndDate?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}