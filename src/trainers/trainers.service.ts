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
      gender: dto.gender ?? null,
      specialization: dto.specializations ? JSON.stringify(dto.specializations) : null,
      yoga_styles: dto.yoga_styles ?? null,
      experience_years: dto.experience_years ?? null,
      certifications: dto.certifications ? JSON.stringify(dto.certifications) : null,
      designations: dto.designations ? JSON.stringify(dto.designations) : null,
      social_media: dto.social_media ? JSON.stringify(dto.social_media) : null,
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
    if (dto.specializations !== undefined) {
      t.specialization = dto.specializations ? JSON.stringify(dto.specializations) : null;
    }
    if (dto.certifications !== undefined) {
      t.certifications = dto.certifications ? JSON.stringify(dto.certifications) : null;
    }
    if (dto.designations !== undefined) {
      t.designations = dto.designations ? JSON.stringify(dto.designations) : null;
    }
    if (dto.social_media !== undefined) {
      t.social_media = dto.social_media ? JSON.stringify(dto.social_media) : null;
    }
    if (dto.full_name !== undefined) t.full_name = dto.full_name;
    if (dto.phone !== undefined) t.phone = dto.phone ?? null;
    if (dto.gender !== undefined) t.gender = dto.gender ?? null;
    if (dto.yoga_styles !== undefined) t.yoga_styles = dto.yoga_styles ?? null;
    if (dto.experience_years !== undefined) t.experience_years = dto.experience_years ?? null;
    if (dto.bio !== undefined) t.bio = dto.bio ?? null;
    if (dto.profile_image_url !== undefined) t.profile_image_url = dto.profile_image_url ?? null;
    if (dto.hourly_rate !== undefined) t.hourly_rate = dto.hourly_rate ?? null;
    if (dto.is_available !== undefined) t.is_available = dto.is_available;
    return this.repo.save(t);
  }

  async deactivate(id: number) {
    const t = await this.findOne(id);
    t.is_available = false;
    return this.repo.save(t);
  }

  // Public: Get only available trainers with professional data only
  async findAvailablePublic() {
    const trainers = await this.repo.find({
      where: { is_available: true },
      order: { id: 'ASC' },
    });

    return trainers.map(t => this.mapToPublicResponse(t));
  }

  // Public: Get single trainer by ID with professional data only
  async findOnePublic(id: number) {
    const t = await this.repo.findOne({ where: { id, is_available: true } });
    if (!t) throw new NotFoundException('Trainer not found or not available');
    return this.mapToPublicResponse(t);
  }

  // Helper to map trainer to public response (exclude sensitive data)
  private mapToPublicResponse(trainer: Trainer) {
    // Parse JSON strings
    let specializations: string[] = [];
    if (trainer.specialization) {
      try {
        specializations = JSON.parse(trainer.specialization);
      } catch {
        specializations = trainer.specialization ? [trainer.specialization] : [];
      }
    }

    let certifications: string[] = [];
    if (trainer.certifications) {
      try {
        certifications = JSON.parse(trainer.certifications);
      } catch {
        certifications = trainer.certifications ? [trainer.certifications] : [];
      }
    }

    let designations: string[] = [];
    if (trainer.designations) {
      try {
        designations = JSON.parse(trainer.designations);
      } catch {
        designations = trainer.designations ? [trainer.designations] : [];
      }
    }

    let social_media: { instagram?: string; youtube?: string; facebook?: string; twitter?: string; linkedin?: string } | undefined;
    if (trainer.social_media) {
      try {
        social_media = JSON.parse(trainer.social_media);
      } catch {
        social_media = undefined;
      }
    }

    return {
      id: trainer.id,
      full_name: trainer.full_name,
      designations: designations.length > 0 ? designations : undefined,
      bio: trainer.bio || undefined,
      specializations: specializations.length > 0 ? specializations : undefined,
      profile_image_url: trainer.profile_image_url || undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
      experience_years: trainer.experience_years || undefined,
      yoga_styles: trainer.yoga_styles || undefined,
      social_media: social_media,
      // Note: rating and total_reviews would come from reviews service if needed
    };
  }
}
