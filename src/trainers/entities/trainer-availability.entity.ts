import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Trainer } from './trainer.entity';

@Entity('trainer_availability')
@Unique('unique_trainer_date', ['trainer_id', 'date'])
export class TrainerAvailability {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'trainer_id' })
  trainer_id: number;

  @ManyToOne(() => Trainer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: Trainer;

  @Column({ type: 'date' })
  @Index('idx_date')
  date: Date;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  is_available: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
}
