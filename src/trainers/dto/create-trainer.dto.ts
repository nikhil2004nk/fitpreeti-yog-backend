import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreateTrainerDto {
  @IsString()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(255)
  full_name: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  specialization?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  yoga_styles?: string;

  @IsInt()
  @IsOptional()
  experience_years?: number;

  @IsString()
  @IsOptional()
  certifications?: string;

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
