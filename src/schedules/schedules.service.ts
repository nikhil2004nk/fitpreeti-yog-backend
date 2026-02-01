import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurrenceType } from '../common/enums/schedule.enums';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

/** Format date as YYYY-MM-DD (local date parts to avoid timezone issues). */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export interface ScheduleRecurrenceInput {
  recurrence_type: RecurrenceType;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  day_of_month: number | null;
  custom_dates: string[] | null;
  effective_from: Date;
  effective_until: Date | null;
}

/**
 * Computes the list of dates (YYYY-MM-DD) when the schedule runs, based on
 * recurrence_type, weekday flags, day_of_month, custom_dates, and effective range.
 */
export function computeAvailableDates(input: ScheduleRecurrenceInput): string[] {
  const { recurrence_type, effective_from, effective_until } = input;
  const from = new Date(effective_from);
  from.setHours(0, 0, 0, 0);
  const until = effective_until ? new Date(effective_until) : null;
  if (until) until.setHours(23, 59, 59, 999);
  // When no end date, cap at 2 years from start for daily/weekly to avoid unbounded lists
  const end = until ?? addDays(from, 730);

  if (recurrence_type === RecurrenceType.DAILY) {
    const dates: string[] = [];
    let current = new Date(from);
    while (current <= end) {
      dates.push(toDateString(current));
      current = addDays(current, 1);
    }
    return dates;
  }

  if (recurrence_type === RecurrenceType.WEEKLY) {
    const weekdays: number[] = [];
    if (input.sunday) weekdays.push(0);
    if (input.monday) weekdays.push(1);
    if (input.tuesday) weekdays.push(2);
    if (input.wednesday) weekdays.push(3);
    if (input.thursday) weekdays.push(4);
    if (input.friday) weekdays.push(5);
    if (input.saturday) weekdays.push(6);
    const dates: string[] = [];
    let current = new Date(from);
    while (current <= end) {
      if (weekdays.includes(current.getDay())) dates.push(toDateString(current));
      current = addDays(current, 1);
    }
    return dates;
  }

  if (recurrence_type === RecurrenceType.MONTHLY) {
    const dayOfMonth = input.day_of_month;
    if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) return [];
    const dates: string[] = [];
    const start = new Date(from);
    const end = until ? new Date(until) : new Date(from.getFullYear() + 10, 11, 31);
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      const monthStart = y === start.getFullYear() ? start.getMonth() : 0;
      const monthEnd = y === end.getFullYear() ? end.getMonth() : 11;
      for (let m = monthStart; m <= monthEnd; m++) {
        const lastDay = new Date(y, m + 1, 0).getDate();
        if (dayOfMonth <= lastDay) {
          const d = new Date(y, m, dayOfMonth);
          if (d >= start && d <= end) dates.push(toDateString(d));
        }
      }
    }
    return dates.sort();
  }

  if (recurrence_type === RecurrenceType.CUSTOM) {
    const custom = input.custom_dates;
    if (!custom?.length) return [];
    const start = new Date(from);
    const end = until ?? new Date(from.getTime());
    const dates = custom
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .filter((s) => {
        const d = new Date(s);
        return !isNaN(d.getTime()) && d >= start && d <= end;
      })
      .sort();
    return [...new Set(dates)];
  }

  return [];
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
  ) {}

  async create(dto: CreateScheduleDto) {
    const effectiveFrom = new Date(dto.effective_from);
    const effectiveUntil = dto.effective_until ? new Date(dto.effective_until) : null;
    const monday = dto.monday ?? false;
    const tuesday = dto.tuesday ?? false;
    const wednesday = dto.wednesday ?? false;
    const thursday = dto.thursday ?? false;
    const friday = dto.friday ?? false;
    const saturday = dto.saturday ?? false;
    const sunday = dto.sunday ?? false;

    const available_dates = computeAvailableDates({
      recurrence_type: dto.recurrence_type,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      day_of_month: dto.day_of_month ?? null,
      custom_dates: dto.custom_dates ?? null,
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
    });

    const s = this.repo.create({
      ...dto,
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      is_active: dto.is_active ?? true,
      available_dates,
    });
    return this.repo.save(s);
  }

  /**
   * Ensures schedule has available_dates for API response (computes if null, e.g. legacy rows).
   * Use when returning schedules from admin, trainer, or customer endpoints.
   */
  ensureAvailableDatesForResponse(schedule: Schedule): Schedule {
    if (schedule.available_dates != null) return schedule;
    schedule.available_dates = computeAvailableDates({
      recurrence_type: schedule.recurrence_type,
      monday: schedule.monday,
      tuesday: schedule.tuesday,
      wednesday: schedule.wednesday,
      thursday: schedule.thursday,
      friday: schedule.friday,
      saturday: schedule.saturday,
      sunday: schedule.sunday,
      day_of_month: schedule.day_of_month,
      custom_dates: schedule.custom_dates,
      effective_from: schedule.effective_from,
      effective_until: schedule.effective_until,
    });
    return schedule;
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    const list = await this.repo.find({
      where,
      relations: ['service', 'trainer', 'trainer.user'],
      order: { start_time: 'ASC' },
    });
    return list.map((s) => this.ensureAvailableDatesForResponse(s));
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['service', 'trainer', 'trainer.user'],
    });
    if (!s) throw new NotFoundException('Schedule not found');
    return this.ensureAvailableDatesForResponse(s);
  }

  async findByTrainer(trainerId: number) {
    const list = await this.repo.find({
      where: { trainer_id: trainerId, is_active: true },
      relations: ['service'],
      order: { start_time: 'ASC' },
    });
    return list.map((s) => this.ensureAvailableDatesForResponse(s));
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const s = await this.findOne(id);

    // Only apply defined fields so we never overwrite existing values with undefined
    if (dto.service_id !== undefined) s.service_id = dto.service_id;
    if (dto.trainer_id !== undefined) s.trainer_id = dto.trainer_id;
    if (dto.name !== undefined) s.name = dto.name;
    if (dto.recurrence_type !== undefined) s.recurrence_type = dto.recurrence_type;
    if (dto.monday !== undefined) s.monday = dto.monday;
    if (dto.tuesday !== undefined) s.tuesday = dto.tuesday;
    if (dto.wednesday !== undefined) s.wednesday = dto.wednesday;
    if (dto.thursday !== undefined) s.thursday = dto.thursday;
    if (dto.friday !== undefined) s.friday = dto.friday;
    if (dto.saturday !== undefined) s.saturday = dto.saturday;
    if (dto.sunday !== undefined) s.sunday = dto.sunday;
    if (dto.day_of_month !== undefined) s.day_of_month = dto.day_of_month;
    if (dto.custom_dates !== undefined) s.custom_dates = dto.custom_dates;
    if (dto.start_time !== undefined) s.start_time = dto.start_time;
    if (dto.end_time !== undefined) s.end_time = dto.end_time;
    if (dto.effective_from !== undefined) s.effective_from = new Date(dto.effective_from);
    if (dto.effective_until !== undefined) s.effective_until = dto.effective_until ? new Date(dto.effective_until) : null;
    if (dto.max_participants !== undefined) s.max_participants = dto.max_participants;
    if (dto.location !== undefined) s.location = dto.location;
    if (dto.meeting_link !== undefined) s.meeting_link = dto.meeting_link;
    if (dto.is_active !== undefined) s.is_active = dto.is_active;

    // Always recompute available_dates from current recurrence + effective range
    s.available_dates = computeAvailableDates({
      recurrence_type: s.recurrence_type,
      monday: s.monday,
      tuesday: s.tuesday,
      wednesday: s.wednesday,
      thursday: s.thursday,
      friday: s.friday,
      saturday: s.saturday,
      sunday: s.sunday,
      day_of_month: s.day_of_month,
      custom_dates: s.custom_dates,
      effective_from: s.effective_from,
      effective_until: s.effective_until,
    });

    return this.repo.save(s);
  }

  async deactivate(id: number) {
    const s = await this.findOne(id);
    s.is_active = false;
    return this.repo.save(s);
  }
}
