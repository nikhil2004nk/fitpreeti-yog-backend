import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'varchar', length: 500, name: 'user_agent' })
  user_agent: string;

  @Column({ type: 'varchar', length: 100, name: 'ip_address' })
  ip_address: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
}
