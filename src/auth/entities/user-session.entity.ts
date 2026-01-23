import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'varchar', length: 500, name: 'user_agent' })
  user_agent: string;

  @Column({ type: 'varchar', length: 100, name: 'ip_address' })
  ip_address: string;

  @Column({ type: 'datetime', name: 'expires_at' })
  expires_at: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;
}
