import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray, IsObject, MaxLength, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SocialMediaDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  instagram?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  youtube?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  facebook?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  twitter?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  linkedin?: string;
}

export class UpdateTrainerDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  full_name?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsString()
  @IsIn(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  @IsString()
  @MaxLength(500)
  @IsOptional()
  yoga_styles?: string;

  @IsInt()
  @IsOptional()
  experience_years?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  designations?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  social_media?: SocialMediaDto;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  profile_image_url?: string;

  @IsNumber()
  @IsOptional()
  hourly_rate?: number;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;
}
