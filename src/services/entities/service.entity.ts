import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ServiceCategory } from '../../service-categories/entities/service-category.entity';
import { ServiceType, ServiceClassType } from '../../common/enums/service.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'category_id' })
  @Index('idx_category_id')
  category_id: number;

  @ManyToOne(() => ServiceCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_slug')
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'short_description' })
  short_description: string | null;

  @Column({ type: 'enum', enum: ServiceType })
  @Index('idx_type')
  type: ServiceType;

  @Column({ type: 'enum', enum: ServiceClassType, name: 'class_type' })
  @Index('idx_class_type')
  class_type: ServiceClassType;

  @Column({ type: 'enum', enum: YogaStyle, nullable: true, name: 'yoga_style' })
  @Index('idx_yoga_style')
  yoga_style: YogaStyle | null;

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

  @OneToMany(() => Booking, booking => booking.service)
  bookings: Booking[];
}
