import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CustomerSubscription } from '../subscriptions/entities/customer-subscription.entity';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceStatus } from '../common/enums/attendance.enums';
import { SubscriptionStatus } from '../common/enums/subscription.enums';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    @InjectRepository(CustomerSubscription)
    private readonly subRepo: Repository<CustomerSubscription>,
  ) {}

  async getCustomersForAttendance(scheduleId: number, date: string) {
    const d = new Date(date);
    const subs = await this.subRepo.find({
      where: {
        schedule_id: scheduleId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['customer', 'customer.user'],
    });
    const result = [];
    for (const sub of subs) {
      if (sub.starts_on && d < new Date(sub.starts_on)) continue;
      if (sub.ends_on && d > new Date(sub.ends_on)) continue;
      const existing = await this.repo.findOne({
        where: {
          customer_id: sub.customer_id,
          schedule_id: scheduleId,
          attendance_date: d,
        },
      });
      result.push({
        customer_id: sub.customer_id,
        full_name: sub.customer.full_name,
        phone: sub.customer.phone,
        subscription_id: sub.id,
        sessions_completed: sub.sessions_completed,
        sessions_remaining: sub.sessions_remaining,
        attendance_status: existing?.status ?? 'not_marked',
        attendance_id: existing?.id ?? null,
      });
    }
    return result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }

  async mark(dto: MarkAttendanceDto, markedByUserId: number) {
    const d = new Date(dto.attendance_date);
    const existing = await this.repo.findOne({
      where: {
        customer_id: dto.customer_id,
        schedule_id: dto.schedule_id,
        attendance_date: d,
      },
    });
    let att: Attendance;
    if (existing) {
      const oldStatus = existing.status;
      existing.status = dto.status;
      existing.notes = dto.notes ?? existing.notes;
      existing.marked_by = markedByUserId;
      att = await this.repo.save(existing);
      await this.adjustSessionsCompleted(dto.subscription_id, oldStatus, dto.status);
    } else {
      att = this.repo.create({
        customer_id: dto.customer_id,
        schedule_id: dto.schedule_id,
        subscription_id: dto.subscription_id,
        attendance_date: d,
        status: dto.status,
        notes: dto.notes ?? null,
        marked_by: markedByUserId,
      });
      att = await this.repo.save(att);
      if (dto.status === AttendanceStatus.PRESENT) {
        await this.incrementSessionsCompleted(dto.subscription_id);
      }
    }
    return att;
  }

  async bulkMark(dto: BulkMarkAttendanceDto, markedByUserId: number) {
    const result: Attendance[] = [];
    for (const m of dto.marks) {
      const d: MarkAttendanceDto = {
        customer_id: m.customer_id,
        schedule_id: dto.schedule_id,
        subscription_id: m.subscription_id,
        attendance_date: dto.attendance_date,
        status: m.status,
        notes: m.notes,
      };
      result.push(await this.mark(d, markedByUserId));
    }
    return result;
  }

  async findByCustomer(customerId: number, startDate?: string, endDate?: string) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.schedule', 's')
      .leftJoinAndSelect('a.markedByUser', 'u')
      .leftJoinAndSelect('s.service', 'svc')
      .where('a.customer_id = :cid', { cid: customerId })
      .orderBy('a.attendance_date', 'DESC');
    if (startDate) qb.andWhere('a.attendance_date >= :start', { start: startDate });
    if (endDate) qb.andWhere('a.attendance_date <= :end', { end: endDate });
    return qb.getMany();
  }

  private async incrementSessionsCompleted(subscriptionId: number) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (sub) {
      sub.sessions_completed = (sub.sessions_completed || 0) + 1;
      if (sub.total_sessions != null) sub.sessions_remaining = sub.total_sessions - sub.sessions_completed;
      await this.subRepo.save(sub);
    }
  }

  private async decrementSessionsCompleted(subscriptionId: number) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (sub && (sub.sessions_completed || 0) > 0) {
      sub.sessions_completed = sub.sessions_completed - 1;
      if (sub.total_sessions != null) sub.sessions_remaining = sub.total_sessions - sub.sessions_completed;
      await this.subRepo.save(sub);
    }
  }

  private async adjustSessionsCompleted(
    subscriptionId: number,
    oldStatus: AttendanceStatus,
    newStatus: AttendanceStatus,
  ) {
    if (oldStatus === AttendanceStatus.PRESENT && newStatus !== AttendanceStatus.PRESENT) {
      await this.decrementSessionsCompleted(subscriptionId);
    } else if (oldStatus !== AttendanceStatus.PRESENT && newStatus === AttendanceStatus.PRESENT) {
      await this.incrementSessionsCompleted(subscriptionId);
    }
  }
}
