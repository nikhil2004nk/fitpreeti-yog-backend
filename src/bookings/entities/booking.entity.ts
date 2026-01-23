import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, user => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, default: '', name: 'user_phone' })
  user_phone: string;

  @Column({ type: 'varchar', length: 36, name: 'service_id' })
  service_id: string;

  @ManyToOne(() => Service, service => service.bookings)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'date', name: 'booking_date' })
  booking_date: Date;

  @Column({ type: 'varchar', length: 50, name: 'booking_time' })
  booking_time: string;

  @Column({ type: 'varchar', length: 255, default: '', name: 'full_name' })
  full_name: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  email: string;

  @Column({ type: 'varchar', length: 20, default: '' })
  phone: string;

  @Column({ type: 'text', nullable: true, name: 'special_requests' })
  special_requests: string | null;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'datetime', name: 'start_time' })
  start_time: Date;

  @Column({ type: 'datetime', name: 'end_time' })
  end_time: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING, name: 'payment_status' })
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_id' })
  payment_id: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
