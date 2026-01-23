// src/trainers/trainers.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class TrainersService {
  private readonly logger = new Logger(TrainersService.name);

  constructor(
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  private toTrainerResponse(trainer: Trainer): TrainerResponseDto {
    // TypeORM handles JSON automatically, but ensure defaults
    const socialMedia = trainer.social_media || {};

    return {
      id: trainer.id,
      name: trainer.name,
      title: trainer.title || undefined,
      bio: trainer.bio || undefined,
      specializations: trainer.specializations || [],
      profileImage: trainer.profile_image || undefined,
      certifications: trainer.certifications || [],
      experienceYears: trainer.experience_years || 0,
      rating: trainer.rating || 0,
      totalReviews: trainer.total_reviews || 0,
      availability: trainer.availability || {},
      socialMedia: {
        instagram: trainer.social_media?.instagram || undefined,
        youtube: trainer.social_media?.youtube || undefined,
      },
      isActive: trainer.is_active !== undefined ? trainer.is_active : true,
      createdAt: trainer.created_at.toISOString(),
      updatedAt: trainer.updated_at.toISOString(),
    };
  }

  async create(createTrainerDto: CreateTrainerDto): Promise<TrainerResponseDto> {
    try {
      const trainer = this.trainerRepository.create({
        name: sanitizeText(createTrainerDto.name),
        title: createTrainerDto.title ? sanitizeText(createTrainerDto.title) : null,
        bio: createTrainerDto.bio ? sanitizeText(createTrainerDto.bio) : null,
        specializations: createTrainerDto.specializations || [],
        profile_image: createTrainerDto.profileImage ? sanitizeText(createTrainerDto.profileImage) : null,
        certifications: createTrainerDto.certifications || [],
        experience_years: createTrainerDto.experienceYears || 0,
        rating: 0,
        total_reviews: 0,
        availability: createTrainerDto.availability || {},
        social_media: createTrainerDto.socialMedia || {},
        is_active: createTrainerDto.isActive !== undefined ? createTrainerDto.isActive : true,
      });

      const savedTrainer = await this.trainerRepository.save(trainer);
      return this.toTrainerResponse(savedTrainer);
    } catch (error) {
      this.logger.error('Error creating trainer:', error);
      throw new BadRequestException('Failed to create trainer');
    }
  }

  async findAll(): Promise<TrainerResponseDto[]> {
    const trainers = await this.trainerRepository.find({
      order: { created_at: 'DESC' },
    });
    
    return trainers.map(trainer => this.toTrainerResponse(trainer));
  }

  async findOne(id: string): Promise<TrainerResponseDto> {
    const trainer = await this.trainerRepository.findOne({ where: { id } });
    
    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    return this.toTrainerResponse(trainer);
  }

  async update(id: string, updateTrainerDto: UpdateTrainerDto): Promise<TrainerResponseDto> {
    const trainer = await this.trainerRepository.findOne({ where: { id } });
    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }
    
    // Update fields
    Object.assign(trainer, {
      ...(updateTrainerDto.name && { name: sanitizeText(updateTrainerDto.name) }),
      ...(updateTrainerDto.title !== undefined && { title: updateTrainerDto.title ? sanitizeText(updateTrainerDto.title) : null }),
      ...(updateTrainerDto.bio !== undefined && { bio: updateTrainerDto.bio ? sanitizeText(updateTrainerDto.bio) : null }),
      ...(updateTrainerDto.specializations && { specializations: updateTrainerDto.specializations }),
      ...(updateTrainerDto.profileImage !== undefined && { profile_image: updateTrainerDto.profileImage ? sanitizeText(updateTrainerDto.profileImage) : null }),
      ...(updateTrainerDto.certifications && { certifications: updateTrainerDto.certifications }),
      ...(updateTrainerDto.experienceYears !== undefined && { experience_years: updateTrainerDto.experienceYears }),
      ...(updateTrainerDto.availability && { availability: updateTrainerDto.availability }),
      ...(updateTrainerDto.socialMedia && { social_media: updateTrainerDto.socialMedia }),
      ...(updateTrainerDto.isActive !== undefined && { is_active: updateTrainerDto.isActive }),
    });

    const updatedTrainer = await this.trainerRepository.save(trainer);
    return this.toTrainerResponse(updatedTrainer);
  }

  async remove(id: string): Promise<void> {
    const trainer = await this.trainerRepository.findOne({ where: { id } });
    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }
    
    await this.trainerRepository.remove(trainer);
  }

  /**
   * Recalculate and update trainer rating and total reviews based on approved reviews
   */
  async updateTrainerRating(trainerId: string): Promise<void> {
    try {
      const result = await this.trainerRepository
        .createQueryBuilder('trainer')
        .leftJoin('trainer.services', 'service')
        .leftJoin('service.bookings', 'booking')
        .leftJoin('booking.reviews', 'review')
        .select('AVG(review.rating)', 'avg_rating')
        .addSelect('COUNT(review.id)', 'total_reviews')
        .where('trainer.id = :trainerId', { trainerId })
        .andWhere('review.is_approved = :isApproved', { isApproved: true })
        .getRawOne();
      
      const avgRating = result?.avg_rating ? parseFloat(result.avg_rating) : 0;
      const totalReviews = result?.total_reviews ? parseInt(result.total_reviews, 10) : 0;
      
      await this.trainerRepository.update(
        { id: trainerId },
        {
          rating: avgRating,
          total_reviews: totalReviews,
        }
      );
      
      this.logger.log(`Updated trainer ${trainerId} rating: ${avgRating.toFixed(2)}, reviews: ${totalReviews}`);
    } catch (error) {
      this.logger.error(`Error updating trainer rating for ${trainerId}:`, error);
      // Don't throw - this is a background update
    }
  }
}
