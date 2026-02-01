export enum SubscriptionPaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

/** How the customer pays total_fees: one-time or installments. */
export enum SubscriptionPaymentType {
  ONE_TIME = 'one_time',
  INSTALLMENT = 'installment',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
