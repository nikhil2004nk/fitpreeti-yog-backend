import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type ServiceOptionKind = 'category' | 'service_format' | 'yoga_type';

@Entity('service_options')
@Unique('uq_service_option_kind_parent_value', ['kind', 'parent', 'value'])
export class ServiceOption {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  kind: ServiceOptionKind;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  /** For category: "". For service_format / yoga_type: parent category value (e.g. "online"). */
  @Column({ type: 'varchar', length: 255, default: '' })
  parent: string;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  display_order: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
