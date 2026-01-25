import { IsString, IsOptional, IsInt, IsBoolean, IsIn, MaxLength } from 'class-validator';

export class UpdateServiceOptionDto {
  @IsString()
  @IsIn(['category', 'service_format', 'yoga_type'])
  @IsOptional()
  kind?: 'category' | 'service_format' | 'yoga_type';

  @IsString()
  @MaxLength(255)
  @IsOptional()
  value?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  parent?: string;

  @IsInt()
  @IsOptional()
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
