// src/trainers/trainers.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { ConfigService } from '@nestjs/config';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeText } from '../common/utils/sanitize.util';

@Injectable()
export class TrainersService {
  private readonly database: string;
  private readonly logger = new Logger(TrainersService.name);

  constructor(
    private readonly clickhouse: ClickhouseService,
    private readonly configService: ConfigService,
  ) {
    this.database = this.configService.get('CLICKHOUSE_DATABASE', 'fitpreeti');
  }

  private toTrainerResponse(trainer: any): TrainerResponseDto {
    // Parse social media with default values
    let socialMedia = {} as any;
    try {
      socialMedia = typeof trainer.social_media === 'string' 
        ? JSON.parse(trainer.social_media || '{}') 
        : (trainer.social_media || {});
    } catch (e) {
      socialMedia = {};
    }
    
    // Ensure socialMedia has default structure with null values
    const defaultSocialMedia = {
      instagram: null,
      youtube: null,
      ...socialMedia
    };

    return {
      id: trainer.id,
      name: trainer.name,
      title: trainer.title || null,
      bio: trainer.bio || null,
      specializations: typeof trainer.specializations === 'string' ? JSON.parse(trainer.specializations) : (trainer.specializations || []),
      profileImage: trainer.profile_image || null,
      certifications: typeof trainer.certifications === 'string' ? JSON.parse(trainer.certifications) : (trainer.certifications || []),
      experienceYears: trainer.experience_years || 0,
      rating: trainer.rating || 0,
      totalReviews: trainer.total_reviews || 0,
      availability: typeof trainer.availability === 'string' ? JSON.parse(trainer.availability) : (trainer.availability || {}),
      socialMedia: defaultSocialMedia,
      isActive: trainer.is_active !== undefined ? trainer.is_active : true,
      createdAt: trainer.created_at,
      updatedAt: trainer.updated_at,
    };
  }

  async create(createTrainerDto: CreateTrainerDto): Promise<TrainerResponseDto> {
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      // Prepare trainer data with sanitization
      const trainerData = {
        id,
        name: sanitizeText(createTrainerDto.name),
        title: createTrainerDto.title ? sanitizeText(createTrainerDto.title) : null,
        bio: createTrainerDto.bio ? sanitizeText(createTrainerDto.bio) : null,
        specializations: JSON.stringify(createTrainerDto.specializations || []),
        profile_image: createTrainerDto.profileImage ? sanitizeText(createTrainerDto.profileImage) : null,
        certifications: JSON.stringify(createTrainerDto.certifications || []),
        experience_years: createTrainerDto.experienceYears || 0,
        rating: 0,
        total_reviews: 0,
        availability: JSON.stringify(createTrainerDto.availability || {}),
        social_media: JSON.stringify(createTrainerDto.socialMedia || {}),
        is_active: createTrainerDto.isActive !== undefined ? createTrainerDto.isActive : true,
        created_at: now,
        updated_at: now
      };

      // Use the insert method from ClickhouseService
      await this.clickhouse.insert('trainers', trainerData);

      return this.findOne(id);
    } catch (error) {
      this.logger.error('Error creating trainer:', error);
      throw new BadRequestException('Failed to create trainer');
    }
  }

  async findAll(): Promise<TrainerResponseDto[]> {
    const query = `SELECT * FROM ${this.database}.trainers ORDER BY created_at DESC`;
    const result = await this.clickhouse.queryParams<any[]>(query, {});
    
    if (!Array.isArray(result)) {
      return [];
    }
    
    return result.map((trainer: any) => {
      // Parse JSON strings back to objects/arrays
      return {
        ...trainer,
        specializations: JSON.parse(trainer.specializations || '[]'),
        certifications: JSON.parse(trainer.certifications || '[]'),
        availability: JSON.parse(trainer.availability || '{}'),
        social_media: trainer.social_media || '{}'
      };
    }).map(this.toTrainerResponse);
  }

  async findOne(id: string): Promise<TrainerResponseDto> {
    const query = `SELECT * FROM ${this.database}.trainers WHERE id = {id:String} LIMIT 1`;
    const result = await this.clickhouse.queryParams<any[]>(query, { id });
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    const trainer = result[0];
    return this.toTrainerResponse(trainer);
  }

  async update(id: string, updateTrainerDto: UpdateTrainerDto): Promise<TrainerResponseDto> {
    await this.findOne(id); // Check if exists
    
    // Build update fields with sanitization
    const updates: string[] = [];
    
    if (updateTrainerDto.name) {
      updates.push(`name = '${sanitizeText(updateTrainerDto.name).replace(/'/g, "''")}'`);
    }
    if (updateTrainerDto.title !== undefined) {
      updates.push(`title = ${updateTrainerDto.title ? `'${sanitizeText(updateTrainerDto.title).replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updateTrainerDto.bio !== undefined) {
      updates.push(`bio = ${updateTrainerDto.bio ? `'${sanitizeText(updateTrainerDto.bio).replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updateTrainerDto.specializations) {
      updates.push(`specializations = '${JSON.stringify(updateTrainerDto.specializations).replace(/'/g, "''")}'`);
    }
    if (updateTrainerDto.profileImage !== undefined) {
      updates.push(`profile_image = ${updateTrainerDto.profileImage ? `'${sanitizeText(updateTrainerDto.profileImage).replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updateTrainerDto.certifications) {
      updates.push(`certifications = '${JSON.stringify(updateTrainerDto.certifications).replace(/'/g, "''")}'`);
    }
    if (updateTrainerDto.experienceYears !== undefined) {
      updates.push(`experience_years = ${updateTrainerDto.experienceYears}`);
    }
    if (updateTrainerDto.availability) {
      updates.push(`availability = '${JSON.stringify(updateTrainerDto.availability).replace(/'/g, "''")}'`);
    }
    if (updateTrainerDto.socialMedia) {
      updates.push(`social_media = '${JSON.stringify(updateTrainerDto.socialMedia).replace(/'/g, "''")}'`);
    }
    if (updateTrainerDto.isActive !== undefined) {
      updates.push(`is_active = ${updateTrainerDto.isActive ? 'true' : 'false'}`);
    }

    if (updates.length === 0) {
      return this.findOne(id);
    }

    // Note: updated_at is the version column for ReplacingMergeTree
    // ClickHouse handles versioning automatically - we cannot update it directly
    // The updated_at will be automatically set when the merge happens

    // Update the record using parameterized WHERE clause
    const updateQuery = `
      ALTER TABLE ${this.database}.trainers 
      UPDATE ${updates.join(', ')} 
      WHERE id = {id:String}
    `;
    await this.clickhouse.queryParams(updateQuery, { id });
    
    // Wait for update to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return updated trainer
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    
    // Delete using parameterized query
    const deleteQuery = `ALTER TABLE ${this.database}.trainers DELETE WHERE id = {id:String}`;
    await this.clickhouse.queryParams(deleteQuery, { id });
  }

  /**
   * Recalculate and update trainer rating and total reviews based on approved reviews
   * Reviews are linked to trainers through: reviews -> bookings -> services -> trainers
   */
  async updateTrainerRating(trainerId: string): Promise<void> {
    try {
      // Get all approved reviews for this trainer through bookings and services
      const query = `
        SELECT 
          AVG(r.rating) as avg_rating,
          COUNT(*) as total_reviews
        FROM ${this.database}.reviews r
        INNER JOIN ${this.database}.bookings b ON r.booking_id = b.id
        INNER JOIN ${this.database}.services s ON b.service_id = s.id
        WHERE s.trainer_id = {trainerId:String}
          AND r.is_approved = true
      `;
      
      const result = await this.clickhouse.queryParams<any[]>(query, { trainerId });
      
      if (Array.isArray(result) && result.length > 0) {
        const stats = result[0];
        const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating) : 0;
        const totalReviews = stats.total_reviews ? parseInt(stats.total_reviews, 10) : 0;
        
        // Update trainer with new rating and review count
        const updateQuery = `
          ALTER TABLE ${this.database}.trainers 
          UPDATE 
            rating = ${avgRating},
            total_reviews = ${totalReviews},
            updated_at = '${new Date().toISOString()}'
          WHERE id = {trainerId:String}
        `;
        
        await this.clickhouse.queryParams(updateQuery, { trainerId });
        
        // Wait for update to process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.logger.log(`Updated trainer ${trainerId} rating: ${avgRating.toFixed(2)}, reviews: ${totalReviews}`);
      } else {
        // No approved reviews, set to 0
        // Note: updated_at is the version column - ClickHouse handles it automatically
        const updateQuery = `
          ALTER TABLE ${this.database}.trainers 
          UPDATE 
            rating = 0,
            total_reviews = 0
          WHERE id = {trainerId:String}
        `;
        
        await this.clickhouse.queryParams(updateQuery, { trainerId });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.logger.error(`Error updating trainer rating for ${trainerId}:`, error);
      // Don't throw - this is a background update
    }
  }
}