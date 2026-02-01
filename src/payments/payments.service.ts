import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums/payment.enums';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreatePaymentDto, processedByUserId?: number) {
    const p = this.repo.create({
      ...dto,
      payment_status: PaymentStatus.COMPLETED,
      processed_by: processedByUserId ?? null,
    });
    const saved = await this.repo.save(p);
    if (saved.subscription_id != null) {
      const totalPaid = await this.repo
        .createQueryBuilder('pay')
        .select('COALESCE(SUM(pay.amount), 0)', 'sum')
        .where('pay.subscription_id = :sid', { sid: saved.subscription_id })
        .andWhere('pay.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne<{ sum: string }>();
      await this.subscriptionsService.recalcPaymentFromPayments(
        saved.subscription_id,
        Number(totalPaid?.sum ?? 0),
      );
    }
    return saved;
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
