import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  LeadInterestedIn,
  LeadPreferredClassType,
  LeadStatus,
  LeadPriority,
  LeadExperienceLevel,
  LeadPreferredTimeSlot,
} from '../../common/enums/lead.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index('idx_email')
  email: string | null;

  @Column({ type: 'varchar', length: 20 })
  @Index('idx_phone')
  phone: string;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'enum', enum: LeadInterestedIn, name: 'interested_in' })
  @Index('idx_interested_in')
  interested_in: LeadInterestedIn;

  @Column({ type: 'enum', enum: LeadPreferredClassType, name: 'preferred_class_type' })
  preferred_class_type: LeadPreferredClassType;

  @Column({ type: 'enum', enum: YogaStyle, nullable: true, name: 'preferred_yoga_style' })
  preferred_yoga_style: YogaStyle | null;

  @Column({ type: 'enum', enum: LeadExperienceLevel, nullable: true, name: 'experience_level' })
  experience_level: LeadExperienceLevel | null;

  @Column({ type: 'enum', enum: LeadPreferredTimeSlot, nullable: true, name: 'preferred_time_slot' })
  preferred_time_slot: LeadPreferredTimeSlot | null;

  @Column({ type: 'text', nullable: true, name: 'health_conditions' })
  health_conditions: string | null;

  @Column({ type: 'text', nullable: true })
  goals: string | null;

  @Column({ type: 'varchar', length: 100, default: 'website' })
  source: string;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  @Index('idx_status')
  status: LeadStatus;

  @Column({ type: 'int', nullable: true, name: 'assigned_to' })
  @Index('idx_assigned_to')
  assigned_to: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignedToUser: User | null;

  @Column({ type: 'enum', enum: LeadPriority, default: LeadPriority.MEDIUM })
  priority: LeadPriority;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true, name: 'follow_up_date' })
  @Index('idx_follow_up_date')
  follow_up_date: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'last_contacted_at' })
  last_contacted_at: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @Index('idx_created_at')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
