import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassBooking } from './entities/class-booking.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { CustomersService } from '../customers/customers.service';
import { CreateClassBookingDto } from './dto/create-class-booking.dto';
import { UpdateClassBookingDto } from './dto/update-class-booking.dto';
import { ClassBookingStatus } from './entities/class-booking.entity';

/**
 * Returns class dates (YYYY-MM-DD) that fall within [startsOn, endsOn]
 * and are in the schedule's available_dates. Each customer gets different
 * booking dates per their start/end period.
 */
function computeBookingDates(
  startsOn: Date,
  endsOn: Date | null,
  scheduleAvailableDates: string[] | null,
): string[] {
  if (!scheduleAvailableDates?.length) return [];
  const startStr = startsOn.toISOString().slice(0, 10);
  const endStr = endsOn ? endsOn.toISOString().slice(0, 10) : null;
  return scheduleAvailableDates.filter((d) => {
    if (d < startStr) return false;
    if (endStr != null && d > endStr) return false;
    return true;
  });
}

@Injectable()
export class ClassBookingsService {
  constructor(
    @InjectRepository(ClassBooking)
    private readonly repo: Repository<ClassBooking>,
    private readonly schedulesService: SchedulesService,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateClassBookingDto) {
    await this.customersService.findOne(dto.customer_id);

    const existing = await this.repo.findOne({
      where: { customer_id: dto.customer_id, schedule_id: dto.schedule_id },
    });
    if (existing) {
      throw new ConflictException('Customer already has a class booking for this schedule');
    }

    const schedule = await this.schedulesService.findOne(dto.schedule_id);
    const scheduleWithDates = this.schedulesService.ensureAvailableDatesForResponse(schedule);
    const startsOn = new Date(dto.starts_on);
    const endsOn = dto.ends_on ? new Date(dto.ends_on) : null;

    if (endsOn && startsOn > endsOn) {
      throw new BadRequestException('starts_on must be on or before ends_on');
    }
    if (dto.service_id !== schedule.service_id) {
      throw new BadRequestException('service_id must match the schedule’s service');
    }

    const booking_dates = computeBookingDates(
      startsOn,
      endsOn,
      scheduleWithDates.available_dates,
    );

    const booking = this.repo.create({
      customer_id: dto.customer_id,
      schedule_id: dto.schedule_id,
      service_id: dto.service_id,
      starts_on: startsOn,
      ends_on: endsOn,
      booking_dates,
      status: ClassBookingStatus.ACTIVE,
    });
    return this.repo.save(booking);
  }

  async findAll(filters?: { customer_id?: number; schedule_id?: number; status?: ClassBookingStatus }) {
    const qb = this.repo
      .createQueryBuilder('cb')
      .leftJoinAndSelect('cb.customer', 'c')
      .leftJoinAndSelect('cb.schedule', 'sch')
      .leftJoinAndSelect('cb.service', 'svc')
      .orderBy('cb.created_at', 'DESC');
    if (filters?.customer_id) qb.andWhere('cb.customer_id = :cid', { cid: filters.customer_id });
    if (filters?.schedule_id) qb.andWhere('cb.schedule_id = :sid', { sid: filters.schedule_id });
    if (filters?.status) qb.andWhere('cb.status = :st', { st: filters.status });
    return qb.getMany();
  }

  async findOne(id: number) {
    const b = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'customer.user', 'schedule', 'service'],
    });
    if (!b) throw new NotFoundException('Class booking not found');
    return b;
  }

  async findByCustomer(customerId: number) {
    return this.repo.find({
      where: { customer_id: customerId },
      relations: ['schedule', 'service'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateClassBookingDto) {
    const b = await this.findOne(id);
    if (dto.starts_on !== undefined) b.starts_on = new Date(dto.starts_on);
    if (dto.ends_on !== undefined) b.ends_on = dto.ends_on ? new Date(dto.ends_on) : null;
    if (dto.status !== undefined) b.status = dto.status;

    // Recompute booking_dates when start/end change
    const schedule = await this.schedulesService.findOne(b.schedule_id);
    const scheduleWithDates = this.schedulesService.ensureAvailableDatesForResponse(schedule);
    b.booking_dates = computeBookingDates(
      b.starts_on,
      b.ends_on,
      scheduleWithDates.available_dates,
    );

    return this.repo.save(b);
  }

  async cancel(id: number) {
    const b = await this.findOne(id);
    b.status = ClassBookingStatus.CANCELLED;
    return this.repo.save(b);
  }
}
