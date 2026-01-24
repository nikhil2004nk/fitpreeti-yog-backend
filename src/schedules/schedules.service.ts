import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
  ) {}

  async create(dto: CreateScheduleDto) {
    const s = this.repo.create({
      ...dto,
      effective_from: new Date(dto.effective_from),
      effective_until: dto.effective_until ? new Date(dto.effective_until) : null,
      monday: dto.monday ?? false,
      tuesday: dto.tuesday ?? false,
      wednesday: dto.wednesday ?? false,
      thursday: dto.thursday ?? false,
      friday: dto.friday ?? false,
      saturday: dto.saturday ?? false,
      sunday: dto.sunday ?? false,
      is_active: dto.is_active ?? true,
    });
    return this.repo.save(s);
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    return this.repo.find({
      where,
      relations: ['service', 'trainer', 'trainer.user'],
      order: { start_time: 'ASC' },
    });
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['service', 'trainer', 'trainer.user'],
    });
    if (!s) throw new NotFoundException('Schedule not found');
    return s;
  }

  async findByTrainer(trainerId: number) {
    return this.repo.find({
      where: { trainer_id: trainerId, is_active: true },
      relations: ['service'],
      order: { start_time: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const s = await this.findOne(id);
    Object.assign(s, dto);
    if (dto.effective_from) s.effective_from = new Date(dto.effective_from);
    if (dto.effective_until !== undefined) s.effective_until = dto.effective_until ? new Date(dto.effective_until) : null;
    return this.repo.save(s);
  }

  async deactivate(id: number) {
    const s = await this.findOne(id);
    s.is_active = false;
    return this.repo.save(s);
  }
}
