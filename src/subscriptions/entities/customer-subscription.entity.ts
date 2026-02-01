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
import { ClassBooking } from '../../class-bookings/entities/class-booking.entity';
import {
  SubscriptionPaymentStatus,
  SubscriptionStatus,
  SubscriptionPaymentType,
} from '../../common/enums/subscription.enums';

/**
 * CustomerSubscription: fees and payment for a single ClassBooking (1:1).
 * No attendance/session fields; attendance is tracked per ClassBooking.
 * Customer, schedule, service, dates come from the linked ClassBooking.
 */
@Entity('customer_subscriptions')
@Unique('unique_class_booking_subscription', ['class_booking_id'])
@Index('idx_class_booking_id', ['class_booking_id'])
export class CustomerSubscription {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'class_booking_id' })
  class_booking_id: number;

  @ManyToOne(() => ClassBooking, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_booking_id' })
  class_booking: ClassBooking;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'total_fees' })
  total_fees: number | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentType,
    nullable: true,
    name: 'payment_type',
  })
  payment_type: SubscriptionPaymentType | null;

  @Column({ type: 'int', nullable: true, name: 'number_of_installments' })
  number_of_installments: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'amount_paid' })
  amount_paid: number;

  /** How much the customer still owes (total_fees - amount_paid). Stored in DB so admins can see it directly. */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    generatedType: 'STORED',
    asExpression: 'GREATEST(0, COALESCE(total_fees, 0) - COALESCE(amount_paid, 0))',
    name: 'remaining_amount',
  })
  remaining_amount: number;

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
