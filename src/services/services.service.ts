import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceType } from '../common/enums/service.enums';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async findPublic(filters?: { type?: ServiceType; class_type?: string; yoga_style?: string }) {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'c')
      .where('s.is_active = :active', { active: true });
    if (filters?.type) qb.andWhere('s.type = :type', { type: filters.type });
    if (filters?.class_type) qb.andWhere('s.class_type = :class_type', { class_type: filters.class_type });
    if (filters?.yoga_style) qb.andWhere('s.yoga_style = :yoga_style', { yoga_style: filters.yoga_style });
    qb.orderBy('s.price', 'ASC');
    return qb.getMany();
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.repo.find({
      where,
      relations: ['category'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({ where: { id }, relations: ['category'] });
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
