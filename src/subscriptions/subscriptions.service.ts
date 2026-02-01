import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from './entities/customer-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { ClassBookingsService } from '../class-bookings/class-bookings.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionStatus, SubscriptionPaymentStatus } from '../common/enums/subscription.enums';
import { PaymentStatus } from '../common/enums/payment.enums';
import { MembershipStatus } from '../common/enums/customer.enums';
import { ClassBooking } from '../class-bookings/entities/class-booking.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CustomersService } from '../customers/customers.service';

/** Normalize to YYYY-MM-DD (TypeORM may return date columns as Date or string). */
function toDateString(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * For a subscription's class booking, returns the list of class dates (YYYY-MM-DD)
 * within starts_on..ends_on that are in the schedule's available_dates.
 */
function getSubscriptionAvailableDates(
  startsOn: Date | string,
  endsOn: Date | string | null,
  scheduleAvailableDates: string[] | null,
): string[] {
  if (!scheduleAvailableDates?.length) return [];
  const startStr = toDateString(startsOn);
  const endStr = toDateString(endsOn);
  if (!startStr) return [];
  return scheduleAvailableDates.filter((d) => {
    if (d < startStr) return false;
    if (endStr != null && d > endStr) return false;
    return true;
  });
}

export type SubscriptionWithExtras = CustomerSubscription & {
  available_dates: string[];
  remaining_amount: number;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly repo: Repository<CustomerSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly schedulesService: SchedulesService,
    private readonly classBookingsService: ClassBookingsService,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateSubscriptionDto, processedByUserId?: number): Promise<SubscriptionWithExtras> {
    if (dto.class_booking_id == null) {
      throw new BadRequestException('class_booking_id is required');
    }
    if (dto.total_fees == null || dto.total_fees < 0) {
      throw new BadRequestException('total_fees is required');
    }
    if (dto.first_payment_amount != null && dto.first_payment_method == null) {
      throw new BadRequestException('first_payment_method is required when first_payment_amount is set');
    }
    if (dto.first_payment_method != null && (dto.first_payment_amount == null || dto.first_payment_amount < 0)) {
      throw new BadRequestException('first_payment_amount is required when first_payment_method is set');
    }
    const cb = await this.classBookingsService.findOne(dto.class_booking_id);
    const existing = await this.repo.findOne({ where: { class_booking_id: dto.class_booking_id } });
    if (existing) throw new ConflictException('This class booking already has a subscription');

    const sub = this.repo.create({
      class_booking_id: cb.id,
      total_fees: dto.total_fees,
      payment_type: dto.payment_type ?? null,
      number_of_installments: dto.number_of_installments ?? null,
      amount_paid: 0,
      payment_status: SubscriptionPaymentStatus.PENDING,
    });
    const saved = await this.repo.save(sub);

    // When a subscription is created for a customer, set their membership_status to active
    await this.customersService.setMembershipStatus(cb.customer_id, MembershipStatus.ACTIVE);

    if (dto.first_payment_amount != null && dto.first_payment_method != null) {
      const payment = this.paymentRepo.create({
        customer_id: cb.customer_id,
        subscription_id: saved.id,
        amount: dto.first_payment_amount,
        payment_method: dto.first_payment_method,
        transaction_id: dto.first_payment_transaction_id ?? null,
        notes: dto.first_payment_notes ?? null,
        payment_status: PaymentStatus.COMPLETED,
        processed_by: processedByUserId ?? null,
      });
      await this.paymentRepo.save(payment);
      const totalPaid = await this.paymentRepo
        .createQueryBuilder('pay')
        .select('COALESCE(SUM(pay.amount), 0)', 'sum')
        .where('pay.subscription_id = :sid', { sid: saved.id })
        .andWhere('pay.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne<{ sum: string }>();
      await this.recalcPaymentFromPayments(saved.id, Number(totalPaid?.sum ?? 0));
    }

    const full = await this.findOne(saved.id);
    return this.attachExtras(full);
  }

  /**
   * Attaches available_dates (from class_booking + schedule) and remaining_amount to a subscription for API response.
   */
  private attachExtras(sub: CustomerSubscription & { class_booking?: ClassBooking & { schedule?: Schedule } }): SubscriptionWithExtras {
    const totalFees = Number(sub.total_fees ?? 0);
    const amountPaid = Number(sub.amount_paid ?? 0);
    const remaining_amount = Math.max(0, totalFees - amountPaid);

    const cb = sub.class_booking;
    if (!cb?.schedule) {
      return { ...sub, available_dates: [], remaining_amount } as SubscriptionWithExtras;
    }
    const scheduleWithDates = this.schedulesService.ensureAvailableDatesForResponse(cb.schedule);
    const dates = getSubscriptionAvailableDates(
      cb.starts_on,
      cb.ends_on,
      scheduleWithDates.available_dates,
    );
    return { ...sub, available_dates: dates, remaining_amount } as SubscriptionWithExtras;
  }

  async findAll(filters?: {
    customer_id?: number;
    schedule_id?: number;
    status?: SubscriptionStatus;
    class_booking_id?: number;
  }): Promise<SubscriptionWithExtras[]> {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.class_booking', 'cb')
      .leftJoinAndSelect('cb.customer', 'c')
      .leftJoinAndSelect('cb.schedule', 'sch')
      .leftJoinAndSelect('cb.service', 'svc')
      .orderBy('s.enrolled_at', 'DESC');
    if (filters?.customer_id) qb.andWhere('cb.customer_id = :cid', { cid: filters.customer_id });
    if (filters?.schedule_id) qb.andWhere('cb.schedule_id = :sid', { sid: filters.schedule_id });
    if (filters?.status) qb.andWhere('s.status = :st', { st: filters.status });
    if (filters?.class_booking_id != null) qb.andWhere('s.class_booking_id = :cbid', { cbid: filters.class_booking_id });
    const list = await qb.getMany();
    return list.map((s) => this.attachExtras(s));
  }

  async findOne(id: number): Promise<CustomerSubscription & { class_booking?: ClassBooking & { schedule?: Schedule } }> {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['class_booking', 'class_booking.customer', 'class_booking.customer.user', 'class_booking.schedule', 'class_booking.service'],
    });
    if (!s) throw new NotFoundException('Subscription not found');
    return s;
  }

  async findOneWithExtras(id: number): Promise<SubscriptionWithExtras> {
    const s = await this.findOne(id);
    return this.attachExtras(s);
  }

  async findByCustomer(customerId: number): Promise<SubscriptionWithExtras[]> {
    const list = await this.repo.find({
      where: { class_booking: { customer_id: customerId } },
      relations: ['class_booking', 'class_booking.schedule', 'class_booking.service'],
      order: { enrolled_at: 'DESC' },
    });
    return list.map((s) => this.attachExtras(s));
  }

  async update(id: number, dto: UpdateSubscriptionDto): Promise<CustomerSubscription> {
    const s = await this.findOne(id);
    if (dto.total_fees !== undefined) s.total_fees = dto.total_fees;
    if (dto.payment_type !== undefined) s.payment_type = dto.payment_type;
    if (dto.number_of_installments !== undefined) s.number_of_installments = dto.number_of_installments;
    if (dto.status !== undefined) s.status = dto.status;
    if (dto.pause_start_date !== undefined) s.pause_start_date = dto.pause_start_date ? new Date(dto.pause_start_date) : null;
    if (dto.pause_end_date !== undefined) s.pause_end_date = dto.pause_end_date ? new Date(dto.pause_end_date) : null;
    if (dto.cancellation_reason !== undefined) s.cancellation_reason = dto.cancellation_reason;
    return this.repo.save(s);
  }

  async cancel(id: number, reason?: string): Promise<CustomerSubscription> {
    const s = await this.findOne(id);
    s.status = SubscriptionStatus.CANCELLED;
    s.cancellation_reason = reason ?? null;
    await this.repo.save(s);

    // 2. Cancel the linked class_booking
    await this.classBookingsService.cancel(s.class_booking_id);

    // 3. If customer has no other active subscriptions, set membership_status to INACTIVE
    const otherActiveCount = await this.repo.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        class_booking: { customer_id: s.class_booking.customer_id },
      },
    });
    if (otherActiveCount === 0) {
      await this.customersService.setMembershipStatus(s.class_booking.customer_id, MembershipStatus.INACTIVE);
    }

    return s;
  }

  /** Recompute amount_paid and payment_status from payments (call after payment create/update). */
  async recalcPaymentFromPayments(subscriptionId: number, totalPaid: number): Promise<void> {
    const sub = await this.repo.findOne({ where: { id: subscriptionId } });
    if (!sub) return;
    const totalFees = Number(sub.total_fees ?? 0);
    sub.amount_paid = totalPaid;
    if (totalPaid >= totalFees && totalFees > 0) {
      sub.payment_status = SubscriptionPaymentStatus.PAID;
    } else if (totalPaid > 0) {
      sub.payment_status = SubscriptionPaymentStatus.PARTIAL;
    } else {
      sub.payment_status = SubscriptionPaymentStatus.PENDING;
    }
    await this.repo.save(sub);
  }
}
