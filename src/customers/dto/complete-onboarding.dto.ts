import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
