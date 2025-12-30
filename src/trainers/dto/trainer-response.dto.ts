import { ApiProperty } from '@nestjs/swagger';
import { Trainer } from '../entities/trainer.entity';
import { TrainerSpecialization } from '../enums/trainer-specialization.enum';

export class TrainerResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier of the trainer',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'Full name of the trainer',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({ 
    description: 'Biography of the trainer',
    required: false,
    example: 'Certified yoga instructor with 5 years of experience',
    nullable: true
  })
  bio: string | null;

  @ApiProperty({ 
    description: 'List of trainer specializations',
    type: [String],
    enum: Object.values(TrainerSpecialization),
    example: [TrainerSpecialization.HATHA, TrainerSpecialization.VINYASA],
    default: []
  })
  specializations: string[];

  @ApiProperty({ 
    description: 'URL to trainer profile image',
    required: false,
    example: 'https://example.com/profile.jpg',
    nullable: true
  })
  profile_image: string | null;

  @ApiProperty({ 
    description: 'Average rating of the trainer (0-5)',
    minimum: 0,
    maximum: 5,
    default: 0,
    example: 4.5
  })
  rating: number;

  @ApiProperty({ 
    description: 'Total number of reviews',
    minimum: 0,
    default: 0,
    example: 42
  })
  total_reviews: number;

  @ApiProperty({ 
    description: 'Trainer availability',
    required: false,
    example: { monday: ['09:00-12:00', '14:00-18:00'], tuesday: ['10:00-13:00'] },
    nullable: true
  })
  availability: Record<string, any> | null;

  @ApiProperty({ 
    description: 'Trainer certifications',
    type: [String],
    example: ['RYT 200', 'Yoga Alliance Certified'],
    default: []
  })
  certifications: string[];

  @ApiProperty({ 
    description: 'Years of experience',
    minimum: 0,
    default: 0,
    example: 5
  })
  experience_years: number;

  @ApiProperty({ 
    description: 'Whether the trainer is active',
    default: true,
    example: true
  })
  is_active: boolean;

  @ApiProperty({ 
    description: 'Date when the trainer was created',
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z'
  })
  created_at: Date;

  @ApiProperty({ 
    description: 'Date when the trainer was last updated',
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z'
  })
  updated_at: Date;
}
