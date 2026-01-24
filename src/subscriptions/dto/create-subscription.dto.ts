import { IsInt, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { SubscriptionPaymentStatus } from '../../common/enums/subscription.enums';

export class CreateSubscriptionDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  schedule_id: number;

  @IsInt()
  service_id: number;

  @IsDateString()
  starts_on: string;

  @IsDateString()
  @IsOptional()
  ends_on?: string;

  @IsInt()
  @IsOptional()
  total_sessions?: number;

  @IsNumber()
  @IsOptional()
  amount_paid?: number;

  @IsEnum(SubscriptionPaymentStatus)
  @IsOptional()
  payment_status?: SubscriptionPaymentStatus;
}
