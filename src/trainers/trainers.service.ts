import { Injectable, NotFoundException } from '@nestjs/common';
import { ClickhouseService } from '../database/clickhouse.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { v4 as uuidv4 } from 'uuid';

type TrainerRecord = Omit<TrainerResponseDto, 'id' | 'created_at' | 'updated_at'> & {
  id: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class TrainersService {
  private readonly tableName = 'trainers';

  constructor(
    private readonly clickhouse: ClickhouseService,
  ) {}

  private toTrainerResponse(trainer: TrainerRecord): TrainerResponseDto {
    return {
      id: trainer.id,
      name: trainer.name,
      bio: trainer.bio ?? null,
      specializations: trainer.specializations || [],
      profile_image: trainer.profile_image ?? null,
      rating: trainer.rating || 0,
      total_reviews: trainer.total_reviews || 0,
      availability: trainer.availability ? JSON.parse(JSON.stringify(trainer.availability)) : null,
      certifications: trainer.certifications || [],
      experience_years: trainer.experience_years || 0,
      is_active: trainer.is_active !== undefined ? Boolean(trainer.is_active) : true,
      created_at: new Date(trainer.created_at),
      updated_at: new Date(trainer.updated_at),
    };
  }

  async create(createTrainerDto: CreateTrainerDto): Promise<TrainerResponseDto> {
    const now = new Date();
    const trainer: TrainerRecord = {
      id: uuidv4(),
      name: createTrainerDto.name,
      bio: createTrainerDto.bio ?? null,
      specializations: createTrainerDto.specializations || [],
      profile_image: createTrainerDto.profileImage ?? null,
      rating: 0,
      total_reviews: 0,
      availability: createTrainerDto.availability || null,
      certifications: createTrainerDto.certifications || [],
      experience_years: createTrainerDto.experienceYears || 0,
      is_active: true, // Default to true
      created_at: now,
      updated_at: now,
    };

    // Convert arrays to JSON strings for insertion
    const specializationsJson = JSON.stringify(trainer.specializations);
    const certificationsJson = JSON.stringify(trainer.certifications);
    const availabilityJson = trainer.availability ? `'${JSON.stringify(trainer.availability).replace(/'/g, "''")}'` : 'NULL';
    const bioValue = trainer.bio ? `'${trainer.bio.replace(/'/g, "''")}'` : 'NULL';
    const profileImageValue = trainer.profile_image ? `'${trainer.profile_image.replace(/'/g, "''")}'` : 'NULL';

    const query = `
      INSERT INTO ${this.tableName} (
        id, name, bio, specializations, profile_image, 
        rating, total_reviews, availability, certifications, 
        experience_years, is_active, created_at, updated_at
      ) VALUES (
        '${trainer.id}',
        '${trainer.name.replace(/'/g, "''")}',
        ${bioValue},
        '${specializationsJson}',
        ${profileImageValue},
        ${trainer.rating},
        ${trainer.total_reviews},
        ${availabilityJson},
        '${certificationsJson}',
        ${trainer.experience_years},
        ${trainer.is_active ? 1 : 0},
        '${now.toISOString().replace('T', ' ').replace('Z', '')}',
        '${now.toISOString().replace('T', ' ').replace('Z', '')}'
      )
    `;

    await this.clickhouse.query(query);

    return this.toTrainerResponse(trainer);
  }

  async findAll(): Promise<TrainerResponseDto[]> {
    const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    const result = await this.clickhouse.query<TrainerRecord[]>(query);
    return result.map(trainer => this.toTrainerResponse(trainer));
  }

  async findOne(id: string): Promise<TrainerResponseDto> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = '${id}' LIMIT 1`;
    const result = await this.clickhouse.query<TrainerRecord[]>(query);
    
    if (result.length === 0) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }
    
    return this.toTrainerResponse(result[0]);
  }

  async update(id: string, updateTrainerDto: UpdateTrainerDto): Promise<TrainerResponseDto> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    const updatedAt = new Date();
    const updateFields: string[] = [];

    // Map camelCase to snake_case and handle special cases
    const fieldMappings: Record<string, string> = {
      profileImage: 'profile_image',
      experienceYears: 'experience_years',
      isActive: 'is_active',
    };

    // Process each field in the update DTO
    for (const [key, value] of Object.entries(updateTrainerDto)) {
      if (value === undefined) continue;

      const dbField = fieldMappings[key] || key;
      
      if (key === 'availability' && value) {
        const jsonValue = JSON.stringify(value).replace(/'/g, "''");
        updateFields.push(`${dbField} = '${jsonValue}'`);
      } else if (key === 'isActive') {
        updateFields.push(`is_active = ${value ? 1 : 0}`);
      } else if (key === 'specializations' || key === 'certifications') {
        const arrayValue = JSON.stringify(value).replace(/'/g, "''");
        updateFields.push(`${dbField} = '${arrayValue}'`);
      } else if (key === 'profileImage') {
        const imgValue = value ? `'${value.replace(/'/g, "''")}'` : 'NULL';
        updateFields.push(`${dbField} = ${imgValue}`);
      } else if (key === 'bio') {
        const bioValue = value ? `'${value.replace(/'/g, "''")}'` : 'NULL';
        updateFields.push(`${dbField} = ${bioValue}`);
      } else if (key === 'name') {
        updateFields.push(`${dbField} = '${value.replace(/'/g, "''")}'`);
      } else if (typeof value === 'string') {
        updateFields.push(`${dbField} = '${value.replace(/'/g, "''")}'`);
      } else {
        updateFields.push(`${dbField} = ${value}`);
      }
    }

    if (updateFields.length === 0) {
      return existing; // No fields to update
    }

    updateFields.push(`updated_at = '${updatedAt.toISOString().replace('T', ' ').replace('Z', '')}'`);

    const query = `
      ALTER TABLE ${this.tableName}
      UPDATE ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    await this.clickhouse.query(query);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const query = `ALTER TABLE ${this.tableName} DELETE WHERE id = '${id}'`;
    await this.clickhouse.query(query);
  }
}