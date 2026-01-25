import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ServiceMode, ServiceFrequency, ServiceAudience } from '../../common/enums/service.enums';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  short_description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  type: string;

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
  duration_minutes: number;

  @IsNumber()
  price: number;

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
