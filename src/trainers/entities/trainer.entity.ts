import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'user_id', unique: true })
  @Index('idx_user_id')
  user_id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'yoga_styles' })
  yoga_styles: string | null;

  @Column({ type: 'int', nullable: true, name: 'experience_years' })
  experience_years: number | null;

  @Column({ type: 'text', nullable: true })
  certifications: string | null;

  @Column({ type: 'text', nullable: true })
  designations: string | null;

  @Column({ type: 'text', nullable: true, name: 'social_media' })
  social_media: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_image_url' })
  profile_image_url: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'hourly_rate' })
  hourly_rate: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  @Index('idx_is_available')
  is_available: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
