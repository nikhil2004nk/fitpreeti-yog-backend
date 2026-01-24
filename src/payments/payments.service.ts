import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums/payment.enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto, processedByUserId?: number) {
    const p = this.repo.create({
      ...dto,
      payment_status: PaymentStatus.COMPLETED,
      processed_by: processedByUserId ?? null,
    });
    return this.repo.save(p);
  }

  async findAll(filters?: { customer_id?: number; subscription_id?: number }) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.customer', 'c')
      .leftJoinAndSelect('p.subscription', 's')
      .orderBy('p.payment_date', 'DESC');
    if (filters?.customer_id) qb.andWhere('p.customer_id = :cid', { cid: filters.customer_id });
    if (filters?.subscription_id) qb.andWhere('p.subscription_id = :sid', { sid: filters.subscription_id });
    return qb.getMany();
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'subscription', 'processedByUser'],
    });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }
}
