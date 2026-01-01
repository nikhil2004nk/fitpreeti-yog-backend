import { IsString, IsArray, IsEmail, IsObject, IsOptional, IsUrl, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SocialMediaDto {
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Instagram must be a valid URL' })
  instagram?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Facebook must be a valid URL' })
  facebook?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'YouTube must be a valid URL' })
  youtube?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'WhatsApp must be a valid URL' })
  whatsapp?: string;
}

export class UpdateInstituteInfoDto {
  @IsString()
  location: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one phone number is required' })
  phone_numbers: string[];

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  @IsOptional()
  social_media?: SocialMediaDto;
}

