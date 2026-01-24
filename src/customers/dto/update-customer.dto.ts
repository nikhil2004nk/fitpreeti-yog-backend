import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { CustomerGender, MembershipStatus, YogaExperienceLevel } from '../../common/enums/customer.enums';

export class UpdateCustomerDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  full_name?: string;

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

  @IsDateString()
  @IsOptional()
  membership_start_date?: string;

  @IsDateString()
  @IsOptional()
  membership_end_date?: string;
}
