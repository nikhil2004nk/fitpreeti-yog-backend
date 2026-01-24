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

@Entity('audit_logs')
@Index('idx_entity', ['entity_type', 'entity_id'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'user_id' })
  @Index('idx_user_id')
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entity_type: string;

  @Column({ type: 'int', name: 'entity_id' })
  entity_id: number;

  @Column({ type: 'json', nullable: true, name: 'old_values' })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true, name: 'new_values' })
  new_values: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @Index('idx_created_at')
  created_at: Date;
}
