import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../leads/entities/lead.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Trainer } from '../trainers/entities/trainer.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Payment } from '../payments/entities/payment.entity';
import { LeadStatus } from '../common/enums/lead.enums';
import { CustomerStatus } from '../common/enums/customer.enums';
import { PaymentStatus } from '../common/enums/payment.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Trainer)
    private readonly trainerRepo: Repository<Trainer>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getStats() {
    const [newLeads, convertedLeads, activeCustomers, activeTrainers, activeSchedules] = await Promise.all([
      this.leadRepo.count({ where: { status: LeadStatus.NEW } }),
      this.leadRepo.count({ where: { status: LeadStatus.CONVERTED } }),
      this.customerRepo.count({ where: { status: CustomerStatus.ACTIVE } }),
      this.trainerRepo.count({ where: { is_available: true } }),
      this.scheduleRepo.count({ where: { is_active: true } }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const row = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'sum')
      .where('p.payment_status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.payment_date >= :start', { start: startOfMonth })
      .getRawOne<{ sum: string }>();

    const monthlyRevenue = row?.sum ? parseFloat(row.sum) : 0;
    return {
      new_leads: newLeads,
      converted_leads: convertedLeads,
      active_customers: activeCustomers,
      active_trainers: activeTrainers,
      active_schedules: activeSchedules,
      monthly_revenue: monthlyRevenue,
    };
  }

  async getLeadConversionReport(months = 6) {
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const raw = await this.leadRepo
      .createQueryBuilder('l')
      .select("DATE_FORMAT(l.created_at, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END)", 'converted')
      .where('l.created_at >= :start', { start })
      .groupBy("DATE_FORMAT(l.created_at, '%Y-%m')")
      .orderBy('month', 'DESC')
      .getRawMany<{ month: string; total: string; converted: string }>();

    return raw.map((r) => ({
      month: r.month,
      total_leads: parseInt(r.total, 10),
      converted: parseInt(r.converted, 10),
      conversion_rate: r.total ? (parseInt(r.converted, 10) / parseInt(r.total, 10)) * 100 : 0,
    }));
  }
}
