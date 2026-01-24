import { IsInt, IsNumber, IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment.enums';

export class CreatePaymentDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  @IsOptional()
  subscription_id?: number;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  transaction_id?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  gateway?: string;

  @IsOptional()
  gateway_response?: Record<string, unknown>;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  invoice_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
