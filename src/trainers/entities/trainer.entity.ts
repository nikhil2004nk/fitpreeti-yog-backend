import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { ClassSchedule } from '../../class-schedule/entities/class-schedule.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'json' })
  specializations: string[];

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_image' })
  profile_image: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'total_reviews' })
  total_reviews: number;

  @Column({ type: 'json' })
  availability: Record<string, any>;

  @Column({ type: 'json' })
  certifications: string[];

  @Column({ type: 'tinyint', default: 0, name: 'experience_years' })
  experience_years: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'json', name: 'social_media' })
  social_media: Record<string, any>;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Service, service => service.trainer)
  services: Service[];

  @OneToMany(() => ClassSchedule, classSchedule => classSchedule.trainer)
  class_schedules: ClassSchedule[];
}
