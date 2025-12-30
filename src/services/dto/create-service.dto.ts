import { IsString, IsNumber, IsNotEmpty, MinLength, IsPositive, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  service_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsPositive()
  duration_minutes: number;

  @IsString()
  @IsUUID()
  @IsOptional()
  trainer_id?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
