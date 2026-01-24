import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly repo: Repository<ServiceCategory>,
  ) {}

  async findPublic() {
    return this.repo.find({
      where: { is_active: true },
      relations: ['children'],
      order: { display_order: 'ASC', id: 'ASC' },
    });
  }

  async findAllTree() {
    const roots = await this.repo.find({
      where: { parent_id: null as any, is_active: true },
      relations: ['children'],
      order: { display_order: 'ASC', id: 'ASC' },
    });
    for (const r of roots) {
      (r as any).children = await this.repo.find({
        where: { parent_id: r.id, is_active: true },
        order: { display_order: 'ASC', id: 'ASC' },
      });
    }
    return roots;
  }

  async findAll() {
    return this.repo.find({ order: { display_order: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number) {
    const c = await this.repo.findOne({ where: { id }, relations: ['parent', 'children'] });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async create(dto: CreateServiceCategoryDto) {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already exists');
    const cat = this.repo.create(dto);
    return this.repo.save(cat);
  }

  async update(id: number, dto: UpdateServiceCategoryDto) {
    const cat = await this.findOne(id);
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.repo.findOne({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already exists');
    }
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }
}
