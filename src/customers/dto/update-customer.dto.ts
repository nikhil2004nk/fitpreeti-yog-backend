import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { CustomerGender, MembershipStatus, YogaExperienceLevel } from '../../common/enums/customer.enums';
import { LeadPreferredClassType } from '../../common/enums/lead.enums';

export class UpdateCustomerDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  full_name?: string;

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

  @IsEnum(YogaExperienceLevel)
  @IsOptional()
  yoga_experience_level?: YogaExperienceLevel;

  @IsEnum(LeadPreferredClassType)
  @IsOptional()
  preferred_class_type?: LeadPreferredClassType;

  @IsString()
  @IsOptional()
  previous_injuries?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  profile_image_url?: string;

  @IsEnum(MembershipStatus)
  @IsOptional()
  membership_status?: MembershipStatus;
}
