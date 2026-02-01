import { IsInt, IsOptional, IsNumber, IsEnum, Min, IsString, MaxLength } from 'class-validator';
import { SubscriptionPaymentType } from '../../common/enums/subscription.enums';
import { PaymentMethod } from '../../common/enums/payment.enums';

export class CreateSubscriptionDto {
  /** Class booking this subscription is for (1:1). Required. */
  @IsInt()
  class_booking_id: number;

  @IsNumber()
  @Min(0)
  total_fees: number;

  @IsEnum(SubscriptionPaymentType)
  @IsOptional()
  payment_type?: SubscriptionPaymentType;

  @IsInt()
  @Min(1)
  @IsOptional()
  number_of_installments?: number;

  /** First payment: amount (when provided, a payment row is created automatically). */
  @IsNumber()
  @Min(0)
  @IsOptional()
  first_payment_amount?: number;

  /** First payment: method (cash, upi, card, etc.). Required if first_payment_amount is set. */
  @IsEnum(PaymentMethod)
  @IsOptional()
  first_payment_method?: PaymentMethod;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  first_payment_transaction_id?: string;

  @IsString()
  @IsOptional()
  first_payment_notes?: string;
}
