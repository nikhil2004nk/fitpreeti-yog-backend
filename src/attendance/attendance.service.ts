import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClassBooking } from '../class-bookings/entities/class-booking.entity';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceStatus } from '../common/enums/attendance.enums';
import { ClassBookingStatus } from '../class-bookings/entities/class-booking.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    @InjectRepository(ClassBooking)
    private readonly classBookingRepo: Repository<ClassBooking>,
  ) {}

  /**
   * Returns customers who have a class booking for this schedule on this date
   * (date is in their booking_dates). Sessions completed = count of dates
   * marked present OR absent (both count as session completed).
   */
  async getCustomersForAttendance(scheduleId: number, date: string) {
    const dateStr = date;
    const bookings = await this.classBookingRepo.find({
      where: {
        schedule_id: scheduleId,
        status: ClassBookingStatus.ACTIVE,
      },
      relations: ['customer', 'customer.user'],
    });
    const result: {
      customer_id: number;
      full_name: string;
      phone: string | null;
      class_booking_id: number;
      sessions_completed: number;
      sessions_remaining: number;
      attendance_status: string;
      attendance_id: number | null;
    }[] = [];
    for (const cb of bookings) {
      const dates = cb.booking_dates ?? [];
      if (!dates.includes(dateStr)) continue;
      // Present or absent both count as session completed
      const sessionsCompleted = await this.repo
        .createQueryBuilder('a')
        .where('a.class_booking_id = :cbid', { cbid: cb.id })
        .andWhere('a.status IN (:...statuses)', {
          statuses: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT],
        })
        .getCount();
      const sessionsRemaining = Math.max(0, dates.length - sessionsCompleted);
      const existing = await this.repo.findOne({
        where: {
          customer_id: cb.customer_id,
          schedule_id: scheduleId,
          attendance_date: dateStr as any,
        },
      });
      result.push({
        customer_id: cb.customer_id,
        full_name: cb.customer.full_name,
        phone: cb.customer.phone,
        class_booking_id: cb.id,
        sessions_completed: sessionsCompleted,
        sessions_remaining: sessionsRemaining,
        attendance_status: existing?.status ?? 'not_marked',
        attendance_id: existing?.id ?? null,
      });
    }
    return result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }

  async mark(dto: MarkAttendanceDto, markedByUserId: number) {
    const cb = await this.classBookingRepo.findOne({
      where: { id: dto.class_booking_id },
      relations: ['customer'],
    });
    if (!cb) throw new NotFoundException('Class booking not found');
    if (cb.customer_id !== dto.customer_id || cb.schedule_id !== dto.schedule_id) {
      throw new BadRequestException('class_booking does not match customer_id/schedule_id');
    }
    const dates = cb.booking_dates ?? [];
    if (!dates.includes(dto.attendance_date)) {
      throw new BadRequestException('attendance_date is not in this class booking’s booking_dates');
    }

    const dateStr = dto.attendance_date;
    const existing = await this.repo.findOne({
      where: {
        customer_id: dto.customer_id,
        schedule_id: dto.schedule_id,
        attendance_date: dateStr as any,
      },
    });
    let att: Attendance;
    if (existing) {
      existing.status = dto.status;
      existing.notes = dto.notes ?? existing.notes;
      existing.marked_by = markedByUserId;
      existing.class_booking_id = dto.class_booking_id;
      att = await this.repo.save(existing);
    } else {
      att = this.repo.create({
        customer_id: dto.customer_id,
        schedule_id: dto.schedule_id,
        class_booking_id: dto.class_booking_id,
        attendance_date: dateStr as any,
        status: dto.status,
        notes: dto.notes ?? null,
        marked_by: markedByUserId,
      });
      att = await this.repo.save(att);
    }
    return att;
  }

  async bulkMark(dto: BulkMarkAttendanceDto, markedByUserId: number) {
    const result: Attendance[] = [];
    for (const m of dto.marks) {
      const d: MarkAttendanceDto = {
        customer_id: m.customer_id,
        schedule_id: dto.schedule_id,
        class_booking_id: m.class_booking_id,
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
      .leftJoinAndSelect('a.class_booking', 'cb')
      .leftJoinAndSelect('a.markedByUser', 'u')
      .leftJoinAndSelect('s.service', 'svc')
      .where('a.customer_id = :cid', { cid: customerId })
      .orderBy('a.attendance_date', 'DESC');
    if (startDate) qb.andWhere('a.attendance_date >= :start', { start: startDate });
    if (endDate) qb.andWhere('a.attendance_date <= :end', { end: endDate });
    return qb.getMany();
  }
}
