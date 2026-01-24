import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { Trainer } from '../../trainers/entities/trainer.entity';
import { RecurrenceType } from '../../common/enums/schedule.enums';

@Entity('schedules')
@Index('idx_effective_dates', ['effective_from', 'effective_until'])
export class Schedule {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'service_id' })
  @Index('idx_service_id')
  service_id: number;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'int', name: 'trainer_id' })
  @Index('idx_trainer_id')
  trainer_id: number;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: RecurrenceType, name: 'recurrence_type' })
  @Index('idx_recurrence_type')
  recurrence_type: RecurrenceType;

  @Column({ type: 'boolean', default: false })
  monday: boolean;

  @Column({ type: 'boolean', default: false })
  tuesday: boolean;

  @Column({ type: 'boolean', default: false })
  wednesday: boolean;

  @Column({ type: 'boolean', default: false })
  thursday: boolean;

  @Column({ type: 'boolean', default: false })
  friday: boolean;

  @Column({ type: 'boolean', default: false })
  saturday: boolean;

  @Column({ type: 'boolean', default: false })
  sunday: boolean;

  @Column({ type: 'tinyint', nullable: true, name: 'day_of_month' })
  day_of_month: number | null;

  @Column({ type: 'json', nullable: true, name: 'custom_dates' })
  custom_dates: string[] | null;

  @Column({ type: 'time', name: 'start_time' })
  start_time: string;

  @Column({ type: 'time', name: 'end_time' })
  end_time: string;

  @Column({ type: 'date', name: 'effective_from' })
  effective_from: Date;

  @Column({ type: 'date', nullable: true, name: 'effective_until' })
  effective_until: Date | null;

  @Column({ type: 'int', name: 'max_participants' })
  max_participants: number;

  @Column({ type: 'int', default: 0, name: 'current_participants' })
  current_participants: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'meeting_link' })
  meeting_link: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_is_active')
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
