import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';

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
  @MinLength(4)
  @IsNotEmpty()
  pin: string;

  @IsOptional()
  @IsEnum(['member', 'admin', 'trainer'])
  role?: string;
}
