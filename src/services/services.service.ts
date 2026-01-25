import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceOptionsService } from './service-options.service';

export interface ServicePublicFilters {
  type?: string;
  service_format?: string;
  yoga_type?: string;
  mode?: string;
  frequency?: string;
  duration_minutes?: number;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
    private readonly serviceOptionsService: ServiceOptionsService,
  ) {}

  async getFlowOptions() {
    return this.serviceOptionsService.buildFlowOptions();
  }

  async findPublic(filters?: ServicePublicFilters) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.is_active = :active', { active: true });
    if (filters?.type) qb.andWhere('s.type = :type', { type: filters.type });
    if (filters?.service_format)
      qb.andWhere('s.service_format = :service_format', { service_format: filters.service_format });
    if (filters?.yoga_type)
      qb.andWhere('s.yoga_type = :yoga_type', { yoga_type: filters.yoga_type });
    if (filters?.mode) qb.andWhere('s.mode = :mode', { mode: filters.mode });
    if (filters?.frequency)
      qb.andWhere('s.frequency = :frequency', { frequency: filters.frequency });
    if (filters?.duration_minutes != null)
      qb.andWhere('s.duration_minutes = :duration_minutes', {
        duration_minutes: filters.duration_minutes,
      });
    qb.orderBy('s.price', 'ASC');
    return qb.getMany();
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.repo.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    return s;
  }

  async create(dto: CreateServiceDto) {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already exists');
    const s = this.repo.create({
      ...dto,
      max_capacity: dto.max_capacity ?? 1,
      is_active: dto.is_active ?? true,
    });
    return this.repo.save(s);
  }

  async update(id: number, dto: UpdateServiceDto) {
    const s = await this.findOne(id);
    if (dto.slug && dto.slug !== s.slug) {
      const ex = await this.repo.findOne({ where: { slug: dto.slug } });
      if (ex) throw new ConflictException('Slug already exists');
    }
    Object.assign(s, dto);
    return this.repo.save(s);
  }

  async deactivate(id: number) {
    const s = await this.findOne(id);
    s.is_active = false;
    return this.repo.save(s);
  }
}
