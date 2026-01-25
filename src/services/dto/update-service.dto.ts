import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ServiceMode, ServiceFrequency, ServiceAudience } from '../../common/enums/service.enums';

export class UpdateServiceDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  short_description?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  type?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  service_format?: string;

  @IsEnum(ServiceMode)
  @IsOptional()
  mode?: ServiceMode;

  @IsEnum(ServiceFrequency)
  @IsOptional()
  frequency?: ServiceFrequency;

  @IsEnum(ServiceAudience)
  @IsOptional()
  audience?: ServiceAudience;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  yoga_type?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  duration_minutes?: number;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_capacity?: number;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  benefits?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  image_url?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  video_url?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
