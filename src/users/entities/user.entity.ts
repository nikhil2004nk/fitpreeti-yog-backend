import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_email')
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_phone')
  phone: string | null;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole })
  @Index('idx_role')
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_is_active')
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  last_login: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];
}
