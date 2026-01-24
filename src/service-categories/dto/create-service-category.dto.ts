import { IsString, IsOptional, IsInt, IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateServiceCategoryDto {
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

  @IsInt()
  @IsOptional()
  parent_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  icon_url?: string;

  @IsInt()
  @IsOptional()
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
