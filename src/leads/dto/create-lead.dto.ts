import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import {
  LeadInterestedIn,
  LeadPreferredClassType,
  LeadExperienceLevel,
  LeadPreferredTimeSlot,
} from '../../common/enums/lead.enums';
import { YogaStyle } from '../../common/enums/yoga-style.enum';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  full_name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsInt()
  @Min(1)
  @Max(150)
  @IsOptional()
  age?: number;

  @IsEnum(LeadInterestedIn)
  interested_in: LeadInterestedIn;

  @IsEnum(LeadPreferredClassType)
  preferred_class_type: LeadPreferredClassType;

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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  source?: string;
}
