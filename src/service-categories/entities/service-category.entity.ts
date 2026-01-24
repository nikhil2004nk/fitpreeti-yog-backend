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

@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_slug')
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true, name: 'parent_id' })
  @Index('idx_parent_id')
  parent_id: number | null;

  @ManyToOne(() => ServiceCategory, (cat) => cat.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: ServiceCategory | null;

  @OneToMany(() => ServiceCategory, (cat) => cat.parent)
  children: ServiceCategory[];

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'icon_url' })
  icon_url: string | null;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  display_order: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_is_active')
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
