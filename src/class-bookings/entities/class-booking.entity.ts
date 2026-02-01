import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Service } from '../../services/entities/service.entity';

export enum ClassBookingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

/**
 * Class booking: customer assigned to a schedule with a start/end period.
 * booking_dates = schedule.available_dates ∩ [starts_on, ends_on] (computed at create/update).
 * Kept separate from subscriptions and from one-off service bookings.
 */
@Entity('class_bookings')
@Unique('unique_customer_schedule_class_booking', ['customer_id', 'schedule_id'])
@Index('idx_class_booking_dates', ['starts_on', 'ends_on'])
export class ClassBooking {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'customer_id' })
  @Index('idx_class_booking_customer')
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int', name: 'schedule_id' })
  @Index('idx_class_booking_schedule')
  schedule_id: number;

  @ManyToOne(() => Schedule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'int', name: 'service_id' })
  @Index('idx_class_booking_service')
  service_id: number;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'date', name: 'starts_on' })
  starts_on: Date;

  @Column({ type: 'date', nullable: true, name: 'ends_on' })
  ends_on: Date | null;

  /** Class dates (YYYY-MM-DD) for this customer: schedule.available_dates ∩ [starts_on, ends_on]. */
  @Column({ type: 'json', nullable: true, name: 'booking_dates' })
  booking_dates: string[] | null;

  @Column({ type: 'enum', enum: ClassBookingStatus, default: ClassBookingStatus.ACTIVE })
  @Index('idx_class_booking_status')
  status: ClassBookingStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
