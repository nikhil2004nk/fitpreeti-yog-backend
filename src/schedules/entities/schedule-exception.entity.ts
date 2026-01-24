import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { User } from '../../users/entities/user.entity';

@Entity('schedule_exceptions')
@Unique('unique_schedule_date', ['schedule_id', 'exception_date'])
export class ScheduleException {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'schedule_id' })
  schedule_id: number;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'date', name: 'exception_date' })
  @Index('idx_exception_date')
  exception_date: Date;

  @Column({ type: 'boolean', default: true, name: 'is_cancelled' })
  is_cancelled: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Column({ type: 'int', name: 'created_by' })
  created_by: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
}
