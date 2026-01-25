import { ApiProperty } from '@nestjs/swagger';

export class TrainerPublicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'Senior Yoga Instructor', required: false })
  designations?: string[];

  @ApiProperty({ example: 'Certified yoga instructor with 10+ years of experience', required: false })
  bio?: string;

  @ApiProperty({ example: ['hatha', 'vinyasa', 'ashtanga'], required: false })
  specializations?: string[];

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  profile_image_url?: string;

  @ApiProperty({ example: ['RYT 500', 'Yoga Alliance Certified'], required: false })
  certifications?: string[];

  @ApiProperty({ example: 10 })
  experience_years?: number;

  @ApiProperty({ example: 'Hatha, Vinyasa, Ashtanga', required: false })
  yoga_styles?: string;

  @ApiProperty({ example: { instagram: '@yogamaster', youtube: 'yogamaster' }, required: false })
  social_media?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };

  @ApiProperty({ example: 4.5, required: false })
  rating?: number;

  @ApiProperty({ example: 10, required: false })
  total_reviews?: number;
}
