import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @Matches(/^\d{6,8}$/, { message: 'PIN must be 6-8 digits' })
  pin: string;
}
