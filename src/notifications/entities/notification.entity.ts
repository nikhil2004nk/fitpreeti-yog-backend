import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../common/enums/notification.enums';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'user_id' })
  @Index('idx_user_id')
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  @Index('idx_type')
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index('idx_status')
  status: NotificationStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  read_at: Date | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  error_message: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @Index('idx_created_at')
  created_at: Date;
}
