import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable({ scope: Scope.REQUEST })
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly repo: Repository<Trainer>,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateTrainerDto) {
    const user = await this.authService.createUser(
      { email: dto.email, password: dto.password },
      UserRole.TRAINER,
    );
    const trainer = this.repo.create({
      user_id: user.id,
      full_name: dto.full_name,
      phone: dto.phone ?? null,
      specialization: dto.specialization ?? null,
      yoga_styles: dto.yoga_styles ?? null,
      experience_years: dto.experience_years ?? null,
      certifications: dto.certifications ?? null,
      bio: dto.bio ?? null,
      profile_image_url: dto.profile_image_url ?? null,
      hourly_rate: dto.hourly_rate ?? null,
      is_available: dto.is_available ?? true,
    });
    return this.repo.save(trainer);
  }

  async findAll() {
    return this.repo.find({
      relations: ['user'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const t = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!t) throw new NotFoundException('Trainer not found');
    return t;
  }

  async findByUserId(userId: number) {
    return this.repo.findOne({ where: { user_id: userId }, relations: ['user'] });
  }

  async update(id: number, dto: UpdateTrainerDto) {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async deactivate(id: number) {
    const t = await this.findOne(id);
    t.is_available = false;
    return this.repo.save(t);
  }
}
