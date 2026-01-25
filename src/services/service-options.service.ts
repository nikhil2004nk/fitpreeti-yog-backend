import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOption, ServiceOptionKind } from './entities/service-option.entity';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto';

@Injectable()
export class ServiceOptionsService {
  constructor(
    @InjectRepository(ServiceOption)
    private readonly repo: Repository<ServiceOption>,
  ) {}

  async findAll(kind?: ServiceOptionKind, parent?: string) {
    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.is_active = :active', { active: true })
      .orderBy('o.display_order', 'ASC')
      .addOrderBy('o.value', 'ASC');
    if (kind) qb.andWhere('o.kind = :kind', { kind });
    if (parent !== undefined) qb.andWhere('o.parent = :parent', { parent: parent ?? '' });
    return qb.getMany();
  }

  async findOne(id: number) {
    const o = await this.repo.findOne({ where: { id } });
    if (!o) throw new NotFoundException('Service option not found');
    return o;
  }

  async create(dto: CreateServiceOptionDto) {
    const parent = dto.parent ?? '';
    const existing = await this.repo.findOne({
      where: { kind: dto.kind, parent, value: dto.value },
    });
    if (existing) throw new ConflictException('Option with same kind, parent and value already exists');
    const o = this.repo.create({
      ...dto,
      parent,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
    });
    return this.repo.save(o);
  }

  async update(id: number, dto: UpdateServiceOptionDto) {
    const o = await this.findOne(id);
    const parent = dto.parent !== undefined ? dto.parent : o.parent;
    const value = dto.value !== undefined ? dto.value : o.value;
    const kind = dto.kind !== undefined ? dto.kind : o.kind;
    if (value !== o.value || parent !== o.parent || kind !== o.kind) {
      const ex = await this.repo.findOne({ where: { kind, parent, value } });
      if (ex && ex.id !== id) throw new ConflictException('Option with same kind, parent and value already exists');
    }
    Object.assign(o, dto);
    if (dto.parent !== undefined) o.parent = dto.parent;
    return this.repo.save(o);
  }

  async remove(id: number) {
    const o = await this.findOne(id);
    await this.repo.remove(o);
  }

  /** Build flow options for GET /services/public/options. */
  async buildFlowOptions() {
    const all = await this.repo.find({
      where: { is_active: true },
      order: { kind: 'ASC', parent: 'ASC', display_order: 'ASC', value: 'ASC' },
    });
    const categories = all.filter((o) => o.kind === 'category').map((o) => o.value);
    const byParent = (kind: 'service_format' | 'yoga_type') => {
      const map: Record<string, string[]> = {};
      for (const o of all.filter((x) => x.kind === kind)) {
        const p = o.parent || '';
        if (!map[p]) map[p] = [];
        map[p].push(o.value);
      }
      return map;
    };
    const service_format_by_type = byParent('service_format');
    const yoga_types_by_type = byParent('yoga_type');
    return {
      type: categories,
      service_format_by_type,
      yoga_types_by_type,
      mode: ['live', 'recorded', 'hybrid', 'onsite'],
      frequency: ['single', 'weekly', 'monthly'],
      audience: ['individual', 'group', 'company'],
    };
  }
}
