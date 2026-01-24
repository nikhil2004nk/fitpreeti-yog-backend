import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from './entities/customer-subscription.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionStatus } from '../common/enums/subscription.enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly repo: Repository<CustomerSubscription>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    const existing = await this.repo.findOne({
      where: { customer_id: dto.customer_id, schedule_id: dto.schedule_id },
    });
    if (existing) throw new ConflictException('Customer already enrolled in this schedule');
    const sub = this.repo.create({
      ...dto,
      starts_on: new Date(dto.starts_on),
      ends_on: dto.ends_on ? new Date(dto.ends_on) : null,
      total_sessions: dto.total_sessions ?? null,
      sessions_remaining: dto.total_sessions != null ? dto.total_sessions : null,
    });
    const saved = await this.repo.save(sub);
    await this.updateScheduleParticipantCount(dto.schedule_id, 1);
    return saved;
  }

  private async updateScheduleParticipantCount(scheduleId: number, delta: number) {
    const s = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (s) {
      s.current_participants = Math.max(0, (s.current_participants || 0) + delta);
      await this.scheduleRepo.save(s);
    }
  }

  async findAll(filters?: { customer_id?: number; schedule_id?: number; status?: SubscriptionStatus }) {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.customer', 'c')
      .leftJoinAndSelect('s.schedule', 'sch')
      .leftJoinAndSelect('s.service', 'svc')
      .orderBy('s.enrolled_at', 'DESC');
    if (filters?.customer_id) qb.andWhere('s.customer_id = :cid', { cid: filters.customer_id });
    if (filters?.schedule_id) qb.andWhere('s.schedule_id = :sid', { sid: filters.schedule_id });
    if (filters?.status) qb.andWhere('s.status = :st', { st: filters.status });
    return qb.getMany();
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'customer.user', 'schedule', 'service'],
    });
    if (!s) throw new NotFoundException('Subscription not found');
    return s;
  }

  async findByCustomer(customerId: number) {
    return this.repo.find({
      where: { customer_id: customerId },
      relations: ['schedule', 'service'],
      order: { enrolled_at: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateSubscriptionDto) {
    const s = await this.findOne(id);
    Object.assign(s, dto);
    if (dto.ends_on) s.ends_on = new Date(dto.ends_on);
    if (dto.pause_start_date) s.pause_start_date = new Date(dto.pause_start_date);
    if (dto.pause_end_date) s.pause_end_date = new Date(dto.pause_end_date);
    if (dto.total_sessions != null) {
      s.total_sessions = dto.total_sessions;
      s.sessions_remaining = dto.total_sessions - s.sessions_completed;
    }
    return this.repo.save(s);
  }

  async cancel(id: number, reason?: string) {
    const s = await this.findOne(id);
    s.status = SubscriptionStatus.CANCELLED;
    s.cancellation_reason = reason ?? null;
    await this.repo.save(s);
    await this.updateScheduleParticipantCount(s.schedule_id, -1);
    return s;
  }
}
