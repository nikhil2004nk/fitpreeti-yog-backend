import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @Matches(/^\d{6,8}$/, { message: 'PIN must be 6-8 digits' })
  pin: string;

  @IsOptional()
  @IsEnum(['customer', 'admin', 'trainer'])
  role?: string;
}
