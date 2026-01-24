import { IsString, IsOptional, IsEnum, IsInt, IsDateString, MaxLength } from 'class-validator';
import {
  LeadStatus,
  LeadPriority,
  LeadInterestedIn,
  LeadPreferredClassType,
  LeadExperienceLevel,
  LeadPreferredTimeSlot,
} from '../../common/enums/lead.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';

export class UpdateLeadDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  full_name?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsInt()
  @IsOptional()
  age?: number;

  @IsEnum(LeadInterestedIn)
  @IsOptional()
  interested_in?: LeadInterestedIn;

  @IsEnum(LeadPreferredClassType)
  @IsOptional()
  preferred_class_type?: LeadPreferredClassType;

  @IsEnum(YogaStyle)
  @IsOptional()
  preferred_yoga_style?: YogaStyle;

  @IsEnum(LeadExperienceLevel)
  @IsOptional()
  experience_level?: LeadExperienceLevel;

  @IsEnum(LeadPreferredTimeSlot)
  @IsOptional()
  preferred_time_slot?: LeadPreferredTimeSlot;

  @IsString()
  @IsOptional()
  health_conditions?: string;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsInt()
  @IsOptional()
  assigned_to?: number;

  @IsEnum(LeadPriority)
  @IsOptional()
  priority?: LeadPriority;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  follow_up_date?: string;

  @IsDateString()
  @IsOptional()
  last_contacted_at?: string;
}
