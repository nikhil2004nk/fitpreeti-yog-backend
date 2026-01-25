import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Trainer } from '../../trainers/entities/trainer.entity';
import { Service } from '../../services/entities/service.entity';

export enum ClassStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
}

export const CLASS_SCHEDULE_TABLE = 'class_schedules';

@Entity('class_schedules')
export class ClassSchedule {
  @ApiProperty({ description: 'Unique identifier of the class' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Title of the class' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Description of the class', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Start time of the class' })
  @Column({ type: 'datetime', name: 'start_time' })
  start_time: Date;

  @ApiProperty({ description: 'End time of the class' })
  @Column({ type: 'datetime', name: 'end_time' })
  end_time: Date;

  @ApiProperty({ enum: ClassStatus, description: 'Status of the class' })
  @Column({ type: 'enum', enum: ClassStatus, default: ClassStatus.SCHEDULED })
  status: ClassStatus;

  @ApiProperty({ description: 'Maximum number of participants' })
  @Column({ type: 'int', name: 'max_participants' })
  max_participants: number;

  @ApiProperty({ description: 'Current number of participants' })
  @Column({ type: 'int', default: 0, name: 'current_participants' })
  current_participants: number;

  @ApiProperty({ description: 'ID of the trainer' })
  @Column({ type: 'int', name: 'trainer_id' })
  trainer_id: number;

  @ManyToOne(() => Trainer)
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @ApiProperty({ description: 'ID of the service' })
  @Column({ type: 'int', name: 'service_id' })
  service_id: number;

  @ManyToOne(() => Service, (service) => service.class_schedules)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({ description: 'Whether this is a recurring class' })
  @Column({ type: 'boolean', default: false, name: 'is_recurring' })
  is_recurring: boolean;

  @ApiProperty({ description: 'Recurrence pattern (daily, weekly, monthly)', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'recurrence_pattern' })
  recurrence_pattern: string | null;

  @ApiProperty({ description: 'End date for recurring classes', required: false })
  @Column({ type: 'datetime', nullable: true, name: 'recurrence_end_date' })
  recurrence_end_date: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
