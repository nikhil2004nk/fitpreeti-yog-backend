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
import { ServiceType, ServiceClassType } from '../../common/enums/service.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';

export class CreateServiceDto {
  @IsInt()
  category_id: number;

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

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsEnum(ServiceClassType)
  class_type: ServiceClassType;

  @IsEnum(YogaStyle)
  @IsOptional()
  yoga_style?: YogaStyle;

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
