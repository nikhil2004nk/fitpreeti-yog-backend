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
import { CustomerSubscription } from '../../subscriptions/entities/customer-subscription.entity';
import { User } from '../../users/entities/user.entity';
import { AttendanceStatus } from '../../common/enums/attendance.enums';

@Entity('attendance')
@Unique('unique_attendance', ['customer_id', 'schedule_id', 'attendance_date'])
@Index('idx_customer_schedule', ['customer_id', 'schedule_id'])
export class Attendance {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int', name: 'schedule_id' })
  schedule_id: number;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'int', name: 'subscription_id' })
  subscription_id: number;

  @ManyToOne(() => CustomerSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: CustomerSubscription;

  @Column({ type: 'date', name: 'attendance_date' })
  @Index('idx_attendance_date')
  attendance_date: Date;

  @Column({ type: 'enum', enum: AttendanceStatus })
  @Index('idx_status')
  status: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'check_in_time' })
  check_in_time: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'check_out_time' })
  check_out_time: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', name: 'marked_by' })
  marked_by: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'marked_by' })
  markedByUser: User;

  @CreateDateColumn({ type: 'timestamp', name: 'marked_at' })
  marked_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
