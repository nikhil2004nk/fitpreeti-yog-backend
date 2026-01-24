import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AppSettingType } from '../../../common/enums/app-settings.enums';

@Entity('app_settings')
export class AppSetting {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'setting_key' })
  @Index('idx_setting_key')
  setting_key: string;

  @Column({ type: 'text', nullable: true, name: 'setting_value' })
  setting_value: string | null;

  @Column({
    type: 'enum',
    enum: AppSettingType,
    default: AppSettingType.STRING,
    name: 'setting_type',
  })
  setting_type: AppSettingType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_public' })
  is_public: boolean;

  @Column({ type: 'int', nullable: true, name: 'updated_by' })
  updated_by: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User | null;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
