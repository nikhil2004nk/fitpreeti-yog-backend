import { ApiProperty } from '@nestjs/swagger';
import { TrainerSpecialization } from '../enums/trainer-specialization.enum';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({ description: 'Full name of the trainer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Biography of the trainer', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ 
    description: 'List of trainer specializations',
    enum: TrainerSpecialization,
    isArray: true,
    example: [TrainerSpecialization.HATHA, TrainerSpecialization.VINYASA]
  })
  @IsArray()
  @IsEnum(TrainerSpecialization, { each: true })
  specializations: TrainerSpecialization[];

  @ApiProperty({ description: 'URL to trainer profile image', required: false })
  @IsUrl()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ 
    description: 'Trainer certifications', 
    type: [String],
    required: false,
    example: ['RYT 200', 'Yoga Alliance Certified']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ description: 'Years of experience', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ 
    description: 'Trainer availability (weekly schedule)', 
    required: false,
    example: {
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      // ... other days
    }
  })
  @IsOptional()
  availability?: any;
}
