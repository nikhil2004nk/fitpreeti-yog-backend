# Admin Enrolls Customer in Schedule (Subscription) – Detail

This document describes how an **admin enrolls a customer in a schedule** (creates a **subscription**), and how to list, update, and cancel subscriptions.

---

## What Is a Subscription?

A **subscription** (entity: `CustomerSubscription`) is the link between:

- **Customer** – who is enrolled  
- **Schedule** – which recurring class they attend  
- **Service** – the service offered by that schedule (e.g. “Morning Yoga”)

When you enroll a customer in a schedule, you create one subscription. That customer then:

- Sees the schedule in the **customer portal** (`GET /customer/schedules`)
- Appears in **attendance** lists for that schedule on each class date
- Has **sessions** tracked: `sessions_completed` and (optionally) `sessions_remaining` / `total_sessions`

---

## Business Rules

| Rule | Description |
|------|-------------|
| **One per customer per schedule** | A customer can have **at most one** subscription per schedule (unique on `customer_id` + `schedule_id`). Enrolling again returns **409 Conflict**. |
| **Participant count** | On **create**, the schedule’s `current_participants` is incremented by 1. On **cancel**, it is decremented by 1. |
| **Service must match** | The `service_id` in the subscription should match the schedule’s service (same class type). |
| **Attendance** | Only subscriptions with status **ACTIVE** are considered for attendance. Attendance marking updates `sessions_completed` (and `sessions_remaining` when `total_sessions` is set). |

---

## Prerequisites Before Enrolling

1. **Customer** – Must exist (create via `POST /admin/customers` or by converting a lead). Use `customer_id`.
2. **Schedule** – Must exist and be the class you want (create via `POST /admin/schedules`). Use `schedule_id`.
3. **Service** – The schedule already has a `service_id`; use the **same** `service_id` for the subscription so the enrollment matches the class’s service.

---

## Base URL & Auth

| Setting | Value |
|---------|--------|
| **Base URL** | `http://localhost:3000/api/v1` (or your deployed API URL) |
| **Auth** | Cookie-based JWT (`access_token`) |
| **Role** | **ADMIN** only for subscription create/list/update/cancel |
| **Credentials** | Send credentials with requests (`credentials: 'include'`) |

---

## API Endpoints

### 1. Enroll Customer in Schedule (Create Subscription)

**`POST /api/v1/admin/subscriptions`**

Creates a new subscription: customer is enrolled in the given schedule.

#### Request Body

```json
{
  "customer_id": 5,
  "schedule_id": 2,
  "service_id": 1,
  "starts_on": "2026-02-01",
  "ends_on": "2026-06-30",
  "total_sessions": 24,
  "amount_paid": 4999.00,
  "payment_status": "paid"
}
```

#### Field Reference (Create)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | number | ✅ | ID of the customer to enroll. |
| `schedule_id` | number | ✅ | ID of the schedule (recurring class). |
| `service_id` | number | ✅ | ID of the service (should match the schedule’s service). |
| `starts_on` | string (date) | ✅ | Subscription start date. ISO date `YYYY-MM-DD`. |
| `ends_on` | string (date) | No | Optional end date. `YYYY-MM-DD`. |
| `total_sessions` | number | No | Total sessions in the plan (e.g. 12, 24). Used to compute `sessions_remaining`. |
| `amount_paid` | number | No | Amount paid for the subscription. |
| `payment_status` | enum | No | `pending` \| `partial` \| `paid` \| `refunded`. Default: `pending`. |

#### Backend Behavior on Create

- Checks that no subscription already exists for this `(customer_id, schedule_id)`; if it does → **409 Conflict** (“Customer already enrolled in this schedule”).
- Creates the subscription with:
  - `starts_on` / `ends_on` (if provided) as dates
  - `total_sessions` and `sessions_remaining` = `total_sessions` when provided
  - `sessions_completed` = 0
  - `status` = `active`
  - `enrolled_at` = current timestamp
- Increments the schedule’s `current_participants` by 1.

#### Response

- **201 Created** – Created subscription object (with relations: `customer`, `schedule`, `service` if returned by your API).
- **409 Conflict** – Customer already enrolled in this schedule.
- **401** – Not authenticated.
- **403** – Not admin.

---

### 2. List Subscriptions

**`GET /api/v1/admin/subscriptions`**

Optional query params filter the list.

#### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `customer_id` | number | Return only subscriptions for this customer. |
| `schedule_id` | number | Return only subscriptions for this schedule. |
| `status` | string | Filter by status: `active`, `paused`, `completed`, `cancelled`. |

#### Examples

- All subscriptions: `GET /api/v1/admin/subscriptions`
- By customer: `GET /api/v1/admin/subscriptions?customer_id=5`
- By schedule: `GET /api/v1/admin/subscriptions?schedule_id=2`
- Active only: `GET /api/v1/admin/subscriptions?status=active`

#### Response

**200 OK** – Array of subscription objects (with `customer`, `schedule`, `service` relations). Ordered by `enrolled_at` DESC.

---

### 3. Get One Subscription

**`GET /api/v1/admin/subscriptions/:id`**

Returns a single subscription by ID, with relations: `customer`, `customer.user`, `schedule`, `service`.

- **200 OK** – Subscription object.
- **404 Not Found** – No subscription with that ID.

---

### 4. Update Subscription

**`PUT /api/v1/admin/subscriptions/:id`**

Update fields of an existing subscription. All body fields are optional.

#### Request Body (all optional)

```json
{
  "ends_on": "2026-08-31",
  "total_sessions": 30,
  "amount_paid": 5999.00,
  "payment_status": "paid",
  "status": "paused",
  "pause_start_date": "2026-03-01",
  "pause_end_date": "2026-03-15",
  "cancellation_reason": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ends_on` | string (date) | New end date. |
| `total_sessions` | number | New total sessions; backend recalculates `sessions_remaining` as `total_sessions - sessions_completed`. |
| `amount_paid` | number | Amount paid. |
| `payment_status` | enum | `pending` \| `partial` \| `paid` \| `refunded`. |
| `status` | enum | `active` \| `paused` \| `completed` \| `cancelled`. |
| `pause_start_date` | string (date) | Start of pause period. |
| `pause_end_date` | string (date) | End of pause period. |
| `cancellation_reason` | string | Reason for cancellation (if status is/will be cancelled). |

**Response:** **200 OK** – Updated subscription object.

---

### 5. Cancel Subscription

**`POST /api/v1/admin/subscriptions/:id/cancel`**

Marks the subscription as **cancelled** and decrements the schedule’s `current_participants` by 1.

#### Request Body (optional)

```json
{
  "reason": "Customer requested cancellation"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `reason` | string | Optional cancellation reason (stored in `cancellation_reason`). |

**Response:** **200 OK** – Cancelled subscription object.

**Note:** Cancelled subscriptions are excluded from attendance lists (only **ACTIVE** subscriptions are considered).

---

## Entity: CustomerSubscription (Reference)

| Column | Type | Description |
|--------|------|-------------|
| `id` | number | Primary key. |
| `customer_id` | number | Enrolled customer. |
| `schedule_id` | number | Schedule (recurring class). |
| `service_id` | number | Service (matches schedule’s service). |
| `starts_on` | date | Start date. |
| `ends_on` | date \| null | End date. |
| `total_sessions` | number \| null | Total sessions in plan. |
| `sessions_completed` | number | Sessions attended (updated by attendance marking). |
| `sessions_remaining` | number \| null | `total_sessions - sessions_completed` when total_sessions set. |
| `amount_paid` | number \| null | Amount paid. |
| `payment_status` | enum | `pending`, `partial`, `paid`, `refunded`. |
| `status` | enum | `active`, `paused`, `completed`, `cancelled`. |
| `pause_start_date` | date \| null | Pause period start. |
| `pause_end_date` | date \| null | Pause period end. |
| `cancellation_reason` | string \| null | Reason if cancelled. |
| `enrolled_at` | timestamp | When the subscription was created. |
| `updated_at` | timestamp | Last update. |

**Unique constraint:** `(customer_id, schedule_id)` – one subscription per customer per schedule.

---

## Enums

### SubscriptionStatus

| Value | Description |
|-------|-------------|
| `active` | Enrolled; included in attendance list. |
| `paused` | Temporarily paused. |
| `completed` | Finished (e.g. all sessions used or end date passed). |
| `cancelled` | Cancelled; schedule’s `current_participants` decremented. |

### SubscriptionPaymentStatus

| Value |
|-------|
| `pending` |
| `partial` |
| `paid` |
| `refunded` |

---

## Flow Summary

1. **Create customer** (if needed) – `POST /admin/customers`.
2. **Create schedule** (if needed) – `POST /admin/schedules` (with `service_id`, `trainer_id`, days, times, etc.).
3. **Enroll customer** – `POST /admin/subscriptions` with `customer_id`, `schedule_id`, `service_id` (same as schedule’s), `starts_on`, and optional `ends_on`, `total_sessions`, `amount_paid`, `payment_status`.
4. **List/check** – `GET /admin/subscriptions?customer_id=X` or `?schedule_id=Y`.
5. **Update** – `PUT /admin/subscriptions/:id` (dates, sessions, status, pause, etc.).
6. **Cancel** – `POST /admin/subscriptions/:id/cancel` (optional body `{ "reason": "..." }`).

After enrollment, the customer sees the schedule in the customer portal, and admin/trainer can mark **attendance** (present/absent) for that schedule on each class date; marking **present** updates the subscription’s `sessions_completed` and `sessions_remaining`.
