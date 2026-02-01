# Subscription & Payment Flow (After Class Booking)

**Class bookings** are used for **attendance**. **Subscriptions** are used only for **fees** for one class booking: admin sets total fees and payment config (one-time or installment). **Payments** are logged in the payment table, linked to a subscription. **Attendance** is based on class booking only (no subscription dependency).

---

## Flow

1. **Class booking** – Admin books customer to a schedule (start/end → `booking_dates`). Used for attendance.
2. **Subscription** – Admin creates **one subscription per class booking** with:
   - **class_booking_id** – Required (1:1 with class booking).
   - **total_fees** – Total amount for this class booking.
   - **payment_type** – `one_time` or `installment`.
   - **number_of_installments** – Optional (e.g. 3 when payment_type is installment).
   - Optional first payment: **first_payment_amount** + **first_payment_method** → creates a payment row automatically.
3. **Payments** – Each payment row is linked to a **subscription** (`subscription_id`). One subscription → many payment rows (installments or single payment).
4. Subscription **amount_paid** and **payment_status** are recomputed from completed payments. **remaining_amount** = total_fees − amount_paid (returned in API response, not stored).

---

## Subscription table (customer_subscriptions)

Subscription holds only **fees and payment lifecycle** for one class booking. Customer, schedule, service, and dates come from the linked **class_booking**.

| Column                 | Description |
|------------------------|-------------|
| **class_booking_id**   | FK to class_bookings (1:1, required). |
| **total_fees**         | Total fees (set by admin). |
| **payment_type**       | `one_time` \| `installment`. |
| **number_of_installments** | For installment (e.g. 3). |
| **amount_paid**        | Sum of completed payments (tallied from payments table). |
| **payment_status**     | pending \| partial \| paid \| refunded. |
| **status**             | active \| paused \| cancelled. |
| **pause_start_date**   | When subscription was paused (optional). |
| **pause_end_date**     | When pause ends (optional). |
| **cancellation_reason**| Set when status is cancelled. |
| **enrolled_at**, **updated_at** | Timestamps. |

- **remaining_amount** is **not** stored; it is computed in the API as `total_fees - amount_paid`.
- List/Get subscription responses include **class_booking** (with customer, schedule, service) and **available_dates** (class dates for that booking) and **remaining_amount**.

---

## Pause and cancellation

- **pause_start_date** / **pause_end_date**: Set via **PUT /admin/subscriptions/:id** with `pause_start_date` and/or `pause_end_date`. Used for temporary holds (e.g. customer on leave). No automatic logic: frontend or business rules decide when to set/clear them.
- **cancellation_reason**: Set when cancelling:
  - **PUT /admin/subscriptions/:id** with `status: "cancelled"` and optional `cancellation_reason`.
  - **POST /admin/subscriptions/:id/cancel** with body `{ "reason": "..." }` (sets status to cancelled and stores the reason).

---

## Payment table (payments)

| Column           | Description |
|------------------|-------------|
| **subscription_id** | FK to customer_subscriptions. One subscription → many payments. |
| customer_id      | Customer. |
| amount           | Payment amount. |
| payment_method   | cash \| upi \| card \| bank_transfer \| online. |
| payment_status   | pending \| completed \| failed \| refunded. |
| payment_date     | When payment was made. |

After each payment create with `subscription_id`, the subscription’s **amount_paid** and **payment_status** are updated.

---

## API summary

### Create subscription (from class booking)

**POST /api/v1/admin/subscriptions**

Body:

```json
{
  "class_booking_id": 1,
  "total_fees": 5000,
  "payment_type": "installment",
  "number_of_installments": 3,
  "first_payment_amount": 2000,
  "first_payment_method": "upi",
  "first_payment_transaction_id": "TXN-001",
  "first_payment_notes": "First installment"
}
```

- `class_booking_id` – Required. Class booking must exist and must not already have a subscription.
- `total_fees` – Required.
- `first_payment_*` – Optional; when provided, a payment row is created and subscription amount_paid/payment_status updated.

### List / Get subscription

- **GET /api/v1/admin/subscriptions?customer_id=&schedule_id=&status=&class_booking_id=**  
  Filters by customer/schedule/status/class_booking (customer and schedule are resolved via class_booking).
- **GET /api/v1/admin/subscriptions/:id**  
  Returns subscription with **class_booking**, **available_dates**, and **remaining_amount**.

### Update subscription

**PUT /api/v1/admin/subscriptions/:id**

Body can include: `total_fees`, `payment_type`, `number_of_installments`, `status`, `pause_start_date`, `pause_end_date`, `cancellation_reason`.  
`amount_paid` and `payment_status` are **not** updatable (they are computed from payments).

### Cancel subscription

**POST /api/v1/admin/subscriptions/:id/cancel**

Body: `{ "reason": "Customer requested cancellation" }`  
Sets status to cancelled and stores the reason.

---

## Summary

| Concept        | Use |
|----------------|-----|
| **Class booking** | Attendance; customer + schedule + start/end → booking_dates. |
| **Subscription**  | Fees for one class booking only; total_fees, payment_type, installments; 1:1 with class_booking; remaining_amount in response. |
| **Payment**       | Payment logs; many per subscription; subscription amount_paid and payment_status from these. |
| **Attendance**    | Based on class_booking only (class_booking_id); no subscription dependency. |

---

## Schema migration (customer_subscriptions & attendance)

If you have existing data:

- **customer_subscriptions**: Columns **customer_id**, **schedule_id**, **service_id**, **starts_on**, **ends_on**, **total_sessions**, **sessions_completed**, **sessions_remaining** were removed. Subscription now has only **class_booking_id** (required), fees/payment fields, status, pause/cancel. Run a migration to drop those columns after ensuring every subscription has a valid **class_booking_id** (or migrate legacy rows to class bookings first).
- **attendance**: Column **subscription_id** was replaced by **class_booking_id** (FK to class_bookings). Run a migration to add **class_booking_id** and backfill from subscription → class_booking (via subscription.class_booking_id), then drop **subscription_id**.
