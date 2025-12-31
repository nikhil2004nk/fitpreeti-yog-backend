import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  booking_id?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  reviewer_type?: string; // e.g., "Zumba Regular", "Yoga Regular", etc.
}

