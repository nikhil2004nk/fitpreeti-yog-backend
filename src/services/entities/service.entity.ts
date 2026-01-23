import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Trainer } from '../../trainers/entities/trainer.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { ClassSchedule } from '../../class-schedule/entities/class-schedule.entity';

export enum ServiceType {
  YOGA = 'yoga',
  MEDITATION = 'meditation',
  WORKSHOP = 'workshop',
  CLASS = 'class'
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'service_name' })
  service_name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ServiceType })
  type: ServiceType;

  @Column({ type: 'int', name: 'duration_minutes' })
  duration_minutes: number;

  @Column({ type: 'varchar', length: 36, name: 'trainer_id' })
  trainer_id: string;

  @ManyToOne(() => Trainer, trainer => trainer.services)
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Booking, booking => booking.service)
  bookings: Booking[];

  @OneToMany(() => ClassSchedule, classSchedule => classSchedule.service)
  class_schedules: ClassSchedule[];
}
