import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Service } from '../../services/entities/service.entity';
import {
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from '../../common/enums/subscription.enums';

@Entity('customer_subscriptions')
@Unique('unique_customer_schedule', ['customer_id', 'schedule_id'])
@Index('idx_dates', ['starts_on', 'ends_on'])
export class CustomerSubscription {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'customer_id' })
  @Index('idx_customer_id')
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int', name: 'schedule_id' })
  @Index('idx_schedule_id')
  schedule_id: number;

  @ManyToOne(() => Schedule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'int', name: 'service_id' })
  @Index('idx_service_id')
  service_id: number;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'date', name: 'starts_on' })
  starts_on: Date;

  @Column({ type: 'date', nullable: true, name: 'ends_on' })
  ends_on: Date | null;

  @Column({ type: 'int', nullable: true, name: 'total_sessions' })
  total_sessions: number | null;

  @Column({ type: 'int', default: 0, name: 'sessions_completed' })
  sessions_completed: number;

  @Column({ type: 'int', nullable: true, name: 'sessions_remaining' })
  sessions_remaining: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'amount_paid' })
  amount_paid: number | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentStatus,
    default: SubscriptionPaymentStatus.PENDING,
    name: 'payment_status',
  })
  payment_status: SubscriptionPaymentStatus;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @Index('idx_status')
  status: SubscriptionStatus;

  @Column({ type: 'date', nullable: true, name: 'pause_start_date' })
  pause_start_date: Date | null;

  @Column({ type: 'date', nullable: true, name: 'pause_end_date' })
  pause_end_date: Date | null;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellation_reason: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'enrolled_at' })
  enrolled_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
