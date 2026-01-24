import { IsOptional, IsDateString, IsEnum, IsString, IsInt, IsNumber } from 'class-validator';
import { SubscriptionStatus, SubscriptionPaymentStatus } from '../../common/enums/subscription.enums';

export class UpdateSubscriptionDto {
  @IsDateString()
  @IsOptional()
  ends_on?: string;

  @IsInt()
  @IsOptional()
  total_sessions?: number;

  @IsOptional()
  @IsNumber()
  amount_paid?: number;

  @IsEnum(SubscriptionPaymentStatus)
  @IsOptional()
  payment_status?: SubscriptionPaymentStatus;

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
