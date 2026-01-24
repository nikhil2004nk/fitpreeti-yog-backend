import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto) {
    const c = this.repo.create({
      ...dto,
      country: dto.country ?? 'India',
    });
    if (dto.date_of_birth) c.date_of_birth = new Date(dto.date_of_birth);
    return this.repo.save(c);
  }

  async findAll(filters?: { membership_status?: string }) {
    const where: any = {};
    if (filters?.membership_status) where.membership_status = filters.membership_status;
    return this.repo.find({
      where,
      relations: ['user', 'lead'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['user', 'lead'],
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByUserId(userId: number) {
    return this.repo.findOne({
      where: { user_id: userId },
      relations: ['user', 'lead'],
    });
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    if (dto.date_of_birth) c.date_of_birth = new Date(dto.date_of_birth);
    if (dto.membership_start_date) c.membership_start_date = new Date(dto.membership_start_date);
    if (dto.membership_end_date) c.membership_end_date = new Date(dto.membership_end_date);
    return this.repo.save(c);
  }
}
