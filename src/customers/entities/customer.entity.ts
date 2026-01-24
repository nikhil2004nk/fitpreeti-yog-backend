import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lead } from '../../leads/entities/lead.entity';
import {
  CustomerGender,
  MembershipStatus,
  YogaExperienceLevel,
} from '../../common/enums/customer.enums';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'user_id', unique: true })
  @Index('idx_user_id')
  user_id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true, name: 'lead_id' })
  @Index('idx_lead_id')
  lead_id: number | null;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead | null;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_phone')
  phone: string | null;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  date_of_birth: Date | null;

  @Column({ type: 'enum', enum: CustomerGender, nullable: true })
  gender: CustomerGender | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_line1' })
  address_line1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_line2' })
  address_line2: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postal_code: string | null;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emergency_contact_name' })
  emergency_contact_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergency_contact_phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'emergency_contact_relation' })
  emergency_contact_relation: string | null;

  @Column({ type: 'text', nullable: true, name: 'medical_conditions' })
  medical_conditions: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ type: 'text', nullable: true, name: 'current_medications' })
  current_medications: string | null;

  @Column({ type: 'text', nullable: true, name: 'fitness_goals' })
  fitness_goals: string | null;

  @Column({ type: 'enum', enum: YogaExperienceLevel, nullable: true, name: 'yoga_experience_level' })
  yoga_experience_level: YogaExperienceLevel | null;

  @Column({ type: 'text', nullable: true, name: 'previous_injuries' })
  previous_injuries: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_image_url' })
  profile_image_url: string | null;

  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE, name: 'membership_status' })
  @Index('idx_membership_status')
  membership_status: MembershipStatus;

  @Column({ type: 'date', nullable: true, name: 'membership_start_date' })
  membership_start_date: Date | null;

  @Column({ type: 'date', nullable: true, name: 'membership_end_date' })
  membership_end_date: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'onboarded_at' })
  onboarded_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
