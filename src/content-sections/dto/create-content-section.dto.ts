import { IsString, IsObject, IsNumber, IsBoolean, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateContentSectionDto {
  @IsString()
  @IsNotEmpty()
  section_key: string;

  @IsObject()
  content: Record<string, any>;

  @IsNumber()
  @Min(0)
  order: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

