import { IsEmail, IsOptional } from 'class-validator';

export class CompleteOnboardingDto {
  @IsEmail()
  @IsOptional()
  email?: string;
}
