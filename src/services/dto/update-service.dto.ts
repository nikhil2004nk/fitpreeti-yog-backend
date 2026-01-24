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
import { ServiceType, ServiceClassType } from '../../common/enums/service.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';

export class UpdateServiceDto {
  @IsInt()
  @IsOptional()
  category_id?: number;

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

  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;

  @IsEnum(ServiceClassType)
  @IsOptional()
  class_type?: ServiceClassType;

  @IsEnum(YogaStyle)
  @IsOptional()
  yoga_style?: YogaStyle;

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
