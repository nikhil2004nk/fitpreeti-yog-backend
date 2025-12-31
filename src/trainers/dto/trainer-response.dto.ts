// src/trainers/dto/trainer-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SocialMediaDto {
  @ApiProperty({ example: 'yogamaster', required: false })
  instagram?: string;

  @ApiProperty({ example: 'yogamaster', required: false })
  youtube?: string;

  [key: string]: any;
}

export class TrainerResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'Founder & Head Trainer', required: false })
  title?: string;

  @ApiProperty({ example: 'Certified yoga instructor', required: false })
  bio?: string;

  @ApiProperty({ example: ['yoga', 'pilates'] })
  specializations: string[];

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  profileImage?: string;

  @ApiProperty({ example: ['RYT 200', 'Yoga Alliance'] })
  certifications: string[];

  @ApiProperty({ example: 5 })
  experienceYears: number;

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty({ example: 10 })
  totalReviews: number;

  @ApiProperty({ example: true, default: true })
  isActive: boolean;

  @ApiProperty({
    example: {
      instagram: 'yogamaster',
      youtube: 'yogamaster'
    },
    required: false
  })
  socialMedia?: SocialMediaDto;

  @ApiProperty({ example: { monday: ['09:00-17:00'] } })
  availability: Record<string, any>;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: string;
}