// src/trainers/dto/create-trainer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsObject, IsBoolean } from 'class-validator';

class SocialMediaDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  youtube?: string;

  [key: string]: any;
}

export class CreateTrainerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Founder & Head Trainer', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: ['yoga', 'pilates'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ example: ['RYT 200', 'Yoga Alliance'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ 
    example: { 
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }]
    }, 
    required: false 
  })
  @IsObject()
  @IsOptional()
  availability?: Record<string, Array<{ start: string; end: string }>>;

  @ApiProperty({ example: true, default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: {
      instagram: 'insta_handle',
      youtube: 'youtube_handle'
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  socialMedia?: SocialMediaDto;
}