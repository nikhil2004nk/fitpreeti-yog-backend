import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ServiceMode, ServiceFrequency, ServiceAudience } from '../../common/enums/service.enums';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_slug')
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'short_description' })
  short_description: string | null;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_type')
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'service_format' })
  @Index('idx_service_format')
  service_format: string | null;

  @Column({ type: 'enum', enum: ServiceMode, nullable: true })
  @Index('idx_mode')
  mode: ServiceMode | null;

  @Column({ type: 'enum', enum: ServiceFrequency, nullable: true })
  @Index('idx_frequency')
  frequency: ServiceFrequency | null;

  @Column({ type: 'enum', enum: ServiceAudience, nullable: true })
  @Index('idx_audience')
  audience: ServiceAudience | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'yoga_type' })
  @Index('idx_yoga_type')
  yoga_type: string | null;

  @Column({ type: 'int', name: 'duration_minutes' })
  duration_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1, name: 'max_capacity' })
  max_capacity: number;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ type: 'text', nullable: true })
  benefits: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'video_url' })
  video_url: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_is_active')
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
