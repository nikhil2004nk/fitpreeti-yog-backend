import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerSubscription } from '../../subscriptions/entities/customer-subscription.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'customer_id' })
  @Index('idx_customer_id')
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int', nullable: true, name: 'subscription_id' })
  @Index('idx_subscription_id')
  subscription_id: number | null;

  @ManyToOne(() => CustomerSubscription, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: CustomerSubscription | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method' })
  payment_method: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'transaction_id' })
  @Index('idx_transaction_id')
  transaction_id: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  @Index('idx_payment_status')
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway: string | null;

  @Column({ type: 'json', nullable: true, name: 'gateway_response' })
  gateway_response: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true, name: 'invoice_number' })
  invoice_number: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'invoice_url' })
  invoice_url: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true, name: 'processed_by' })
  processed_by: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by' })
  processedByUser: User | null;

  @CreateDateColumn({ type: 'timestamp', name: 'payment_date' })
  @Index('idx_payment_date')
  payment_date: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
