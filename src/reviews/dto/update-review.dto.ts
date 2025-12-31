import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, MaxLength } from 'class-validator';

export class UpdateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  reviewer_type?: string;

  @IsBoolean()
  @IsOptional()
  is_approved?: boolean; // Admin only
}

