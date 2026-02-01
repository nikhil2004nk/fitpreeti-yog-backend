import { IsOptional, IsDateString, IsEnum, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { SubscriptionStatus, SubscriptionPaymentType } from '../../common/enums/subscription.enums';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_fees?: number;

  @IsEnum(SubscriptionPaymentType)
  @IsOptional()
  payment_type?: SubscriptionPaymentType;

  @IsInt()
  @Min(1)
  @IsOptional()
  number_of_installments?: number;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsDateString()
  @IsOptional()
  pause_start_date?: string;

  @IsDateString()
  @IsOptional()
  pause_end_date?: string;

  @IsString()
  @IsOptional()
  cancellation_reason?: string;
}
