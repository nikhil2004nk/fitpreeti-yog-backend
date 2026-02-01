import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { CustomerGender, YogaExperienceLevel } from '../../common/enums/customer.enums';
import { LeadPreferredClassType } from '../../common/enums/lead.enums';

/**
 * Create customer: only full_name is required so admin can save partial info (status = onboarding).
 * If email is provided → complete onboarding in one go (create login, status = active).
 * If email omitted → status = onboarding; admin can later PUT update and POST :id/complete-onboarding.
 */
export class CreateCustomerDto {
  @IsInt()
  @IsOptional()
  user_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  full_name: string;

  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsEnum(CustomerGender)
  @IsOptional()
  gender?: CustomerGender;

  @IsEnum(YogaExperienceLevel)
  @IsOptional()
  yoga_experience_level?: YogaExperienceLevel;

  @IsEnum(LeadPreferredClassType)
  @IsOptional()
  preferred_class_type?: LeadPreferredClassType;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  address_line1?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  address_line2?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  state?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  postal_code?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  emergency_contact_relation?: string;

  @IsString()
  @IsOptional()
  medical_conditions?: string;

  @IsString()
  @IsOptional()
  allergies?: string;

  @IsString()
  @IsOptional()
  current_medications?: string;

  @IsString()
  @IsOptional()
  fitness_goals?: string;

  @IsString()
  @IsOptional()
  previous_injuries?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  profile_image_url?: string;
}
