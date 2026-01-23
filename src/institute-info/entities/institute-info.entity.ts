import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('institute_info')
export class InstituteInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  location: string;

  @Column({ type: 'json', name: 'phone_numbers' })
  phone_numbers: string[];

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'json', default: '{}', name: 'social_media' })
  social_media: Record<string, any>;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}

