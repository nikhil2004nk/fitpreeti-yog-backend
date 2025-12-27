import { IsString, IsNumber, IsNotEmpty, MinLength, IsPositive } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  service_type: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  service_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  duration: number; // minutes
}
