import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'booking_id' })
  booking_id: string | null;

  @Column({ type: 'tinyint' })
  rating: number; // 1-5

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reviewer_type' })
  reviewer_type: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_approved' })
  is_approved: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
