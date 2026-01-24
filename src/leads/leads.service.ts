import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { LeadStatus } from '../common/enums/lead.enums';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepo: Repository<LeadActivity>,
  ) {}

  async create(dto: CreateLeadDto) {
    const lead = this.leadRepo.create({
      ...dto,
      source: dto.source ?? 'website',
    });
    return this.leadRepo.save(lead);
  }

  async findAll(filters?: {
    status?: LeadStatus | LeadStatus[];
    assigned_to?: number;
    interested_in?: string;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.leadRepo.createQueryBuilder('l').leftJoinAndSelect('l.assignedToUser', 'u').orderBy('l.created_at', 'DESC');

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      qb.andWhere('l.status IN (:...statuses)', { statuses });
    }
    if (filters?.assigned_to != null) qb.andWhere('l.assigned_to = :assigned_to', { assigned_to: filters.assigned_to });
    if (filters?.interested_in) qb.andWhere('l.interested_in = :interested_in', { interested_in: filters.interested_in });

    const total = await qb.getCount();
    if (filters?.limit != null) qb.take(filters.limit);
    if (filters?.offset != null) qb.skip(filters.offset);

    const data = await qb.getMany();
    return { data, total };
  }

  async findOne(id: number) {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedToUser'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async findActivities(leadId: number) {
    return this.activityRepo.find({
      where: { lead_id: leadId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateLeadDto) {
    const lead = await this.findOne(id);
    Object.assign(lead, dto);
    if (dto.last_contacted_at) lead.last_contacted_at = new Date(dto.last_contacted_at);
    if (dto.follow_up_date) lead.follow_up_date = new Date(dto.follow_up_date);
    return this.leadRepo.save(lead);
  }

  async addActivity(leadId: number, userId: number, dto: CreateLeadActivityDto) {
    await this.findOne(leadId);
    const act = this.activityRepo.create({
      lead_id: leadId,
      user_id: userId,
      ...dto,
    });
    return this.activityRepo.save(act);
  }

  async convert(id: number) {
    const lead = await this.findOne(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead already converted');
    }
    lead.status = LeadStatus.CONVERTED;
    await this.leadRepo.save(lead);
    return { lead, message: 'Lead marked as converted. Create customer with lead_id when onboarding.' };
  }
}
