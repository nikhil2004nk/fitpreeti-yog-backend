# Class Booking Flow (Separate from Subscription)

Class bookings are **separate** from subscriptions and from one-off service **bookings**. Use this flow when you onboard a customer and then **book** them to a class schedule with a start/end period.

---

## Flow

1. **Onboard customer** – Customer record exists (from lead convert or `POST /admin/customers`).
2. **Admin books customer to a schedule** – `POST /api/v1/admin/class-bookings` with:
   - `customer_id`, `schedule_id`, `service_id` (must match schedule’s service)
   - `starts_on`, `ends_on` – the customer’s period for this class
3. **Backend** computes **booking_dates** = schedule’s `available_dates` ∩ [starts_on, ends_on] and stores them in the **class_bookings** table.
4. Each customer has **different booking dates** per their start/end date for that schedule.

---

## Entity: ClassBooking

| Column        | Type     | Description |
|---------------|----------|-------------|
| id            | number   | PK. |
| customer_id   | number   | Customer. |
| schedule_id   | number   | Class schedule. |
| service_id    | number   | Must match schedule’s service. |
| starts_on     | date     | Customer’s start date. |
| ends_on       | date \| null | Customer’s end date. |
| **booking_dates** | string[] (JSON) | **Computed**: schedule.available_dates ∩ [starts_on, ends_on]. |
| status        | enum     | `active` \| `cancelled`. |
| created_at, updated_at | timestamp | |

**Unique:** one class booking per (customer_id, schedule_id).

---

## API (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/admin/class-bookings` | Create class booking; computes and stores booking_dates. |
| GET    | `/api/v1/admin/class-bookings` | List all. Query: `customer_id`, `schedule_id`, `status`. |
| GET    | `/api/v1/admin/class-bookings/customer/:customerId` | List class bookings for a customer. |
| GET    | `/api/v1/admin/class-bookings/:id` | Get one. |
| PUT    | `/api/v1/admin/class-bookings/:id` | Update starts_on/ends_on; recomputes booking_dates. |
| POST   | `/api/v1/admin/class-bookings/:id/cancel` | Set status to cancelled. |

---

## Create body

```json
{
  "customer_id": 1,
  "schedule_id": 9,
  "service_id": 1,
  "starts_on": "2026-01-26",
  "ends_on": "2026-02-15"
}
```

- **booking_dates** in the response (and in the table) = those dates from the schedule’s `available_dates` that fall between `starts_on` and `ends_on`.

---

## Subscription vs Class Booking

| | Subscription | Class Booking |
|---|--------------|----------------|
| **Table** | customer_subscriptions | class_bookings |
| **Use** | Enrollment link (customer ↔ schedule); sessions, payment, pause/cancel. | Post-onboarding: assign customer to schedule with start/end; store **booking_dates** for that period. |
| **Dates** | starts_on, ends_on; optional `available_dates` in API response (computed). | starts_on, ends_on; **booking_dates** computed and **stored** (schedule.available_dates ∩ period). |

Keep subscriptions and class bookings separate; use class bookings when you need per-customer booking dates stored in a booking table.
