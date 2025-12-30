// src/trainers/trainers.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TrainersService {
  private readonly table = 'trainers';

  constructor(private readonly clickhouse: ClickhouseService) {}

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
      // Prepare values with proper escaping
      const values = {
        id: `'${id}'`,
        name: `'${createTrainerDto.name.replace(/'/g, "''")}'`,
        bio: createTrainerDto.bio ? `'${createTrainerDto.bio.replace(/'/g, "''")}'` : 'NULL',
        specializations: `'${JSON.stringify(createTrainerDto.specializations || [])}'`,
        profile_image: createTrainerDto.profileImage ? `'${createTrainerDto.profileImage.replace(/'/g, "''")}'` : 'NULL',
        certifications: `'${JSON.stringify(createTrainerDto.certifications || [])}'`,
        experience_years: createTrainerDto.experienceYears || 0,
        rating: 0,
        total_reviews: 0,
        availability: `'${JSON.stringify(createTrainerDto.availability || {}).replace(/'/g, "''")}'`,
        social_media: `'${JSON.stringify(createTrainerDto.socialMedia || {}).replace(/'/g, "''")}'`,
        is_active: createTrainerDto.isActive !== undefined ? createTrainerDto.isActive : true,
        created_at: `'${now}'`,
        updated_at: `'${now}'`
      };

      // Build the INSERT query
      const columns = Object.keys(values).join(', ');
      const valueList = Object.values(values).join(', ');

      const query = `INSERT INTO ${this.table} (${columns}) VALUES (${valueList})`;
      await this.clickhouse.query(query);

      return this.findOne(id);
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw new BadRequestException('Failed to create trainer');
    }
  }

  async findAll(): Promise<TrainerResponseDto[]> {
    const query = `SELECT * FROM ${this.table} ORDER BY created_at DESC`;
    const result = await this.clickhouse.query(query);
    return result.map((trainer: any) => {
      // Parse JSON strings back to objects/arrays
      return {
        ...trainer,
        specializations: JSON.parse(trainer.specializations || '[]'),
        certifications: JSON.parse(trainer.certifications || '[]'),
        availability: JSON.parse(trainer.availability || '{}'),
        socialMedia: JSON.parse(trainer.social_media || '{}')
      };
    }).map(this.toTrainerResponse);
  }

  async findOne(id: string): Promise<TrainerResponseDto> {
    const query = `SELECT * FROM ${this.table} WHERE id = '${id}' LIMIT 1`;
    const result = await this.clickhouse.query(query);
    
    if (!result || result.length === 0) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    const trainer = result[0];
    return this.toTrainerResponse(trainer);
  }

  async update(id: string, updateTrainerDto: UpdateTrainerDto): Promise<TrainerResponseDto> {
    await this.findOne(id); // Check if exists
    
    const updates: string[] = [];
    
    // Build update fields
    if (updateTrainerDto.name) updates.push(`name = '${updateTrainerDto.name.replace(/'/g, "''")}'`);
    if (updateTrainerDto.bio !== undefined) {
      updates.push(`bio = ${updateTrainerDto.bio ? `'${updateTrainerDto.bio.replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updateTrainerDto.specializations) {
      updates.push(`specializations = '${JSON.stringify(updateTrainerDto.specializations)}'`);
    }
    if (updateTrainerDto.profileImage !== undefined) {
      updates.push(`profile_image = ${updateTrainerDto.profileImage ? `'${updateTrainerDto.profileImage.replace(/'/g, "''")}'` : 'NULL'}`);
    }
    if (updateTrainerDto.certifications) {
      updates.push(`certifications = '${JSON.stringify(updateTrainerDto.certifications)}'`);
    }
    if (updateTrainerDto.experienceYears !== undefined) {
      updates.push(`experience_years = ${updateTrainerDto.experienceYears}`);
    }
    if (updateTrainerDto.availability) {
      updates.push(`availability = '${JSON.stringify(updateTrainerDto.availability)}'`);
    }
    if (updateTrainerDto.socialMedia) {
      updates.push(`social_media = '${JSON.stringify(updateTrainerDto.socialMedia)}'`);
    }
    if (updateTrainerDto.isActive !== undefined) {
      updates.push(`is_active = ${updateTrainerDto.isActive ? 'true' : 'false'}`);
    }

    if (updates.length === 0) {
      return this.findOne(id);
    }

    // Update the record
    await this.clickhouse.query(`ALTER TABLE ${this.table} UPDATE ${updates.join(', ')} WHERE id = '${id.replace(/'/g, "''")}'`);
    
    // Add a small delay to ensure the update is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Retry mechanism to get the updated record
    const maxRetries = 5;
    let retries = 0;
    let result;
    
    while (retries < maxRetries) {
      result = await this.clickhouse.query(`SELECT * FROM ${this.table} FINAL WHERE id = '${id}'`);
      
      if (result && result.length > 0) {
        const updatedTrainer = result[0];
        // Verify if the record was actually updated by checking one of the updated fields
        if (updateTrainerDto.name && updatedTrainer.name !== updateTrainerDto.name) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        return this.toTrainerResponse(updatedTrainer);
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If we got here, we couldn't verify the update after retries
    // Return the record anyway, even if we can't verify the update
    result = await this.clickhouse.query(`SELECT * FROM ${this.table} FINAL WHERE id = '${id}'`);
    if (!result || result.length === 0) {
      throw new NotFoundException(`Trainer with ID ${id} not found after update`);
    }
    
    return this.toTrainerResponse(result[0]);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.clickhouse.query(`ALTER TABLE ${this.table} DELETE WHERE id = '${id}'`);
  }
}