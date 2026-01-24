import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { LeadActivityType } from '../../common/enums/lead.enums';

export class CreateLeadActivityDto {
  @IsEnum(LeadActivityType)
  activity_type: LeadActivityType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
