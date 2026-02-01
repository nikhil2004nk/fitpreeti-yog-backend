# Trainer See Their Schedules – Detail

This document describes how **trainers** see their class schedules: endpoints, auth, response shape, and behavior. Customers see schedules only **via their subscriptions** (`GET /api/v1/customer/subscriptions`), which include schedule and service.

---

## Overview

| Role     | Endpoint                    | Source of schedules                                      |
|----------|-----------------------------|----------------------------------------------------------|
| Trainer  | `GET /api/v1/trainer/schedules`   | Schedules where the trainer is **assigned** (active only) |

Requires **cookie-based JWT** and role `TRAINER`.

---

## Base URL & Auth

| Setting        | Value |
|----------------|--------|
| **Base URL**   | `http://localhost:3000/api/v1` (or your deployed API URL) |
| **Auth**       | Cookie-based JWT (`access_token`) |
| **Credentials**| Send credentials with every request (`credentials: 'include'`) |

---

# Trainer: My Schedules

## Endpoint

**`GET /api/v1/trainer/schedules`**

Returns the list of **schedules** (recurring classes) where the logged-in user is the **assigned trainer**.

## Who Can Call

- **Role:** `TRAINER`
- **Identity:** Trainer is resolved from the JWT: `req.user.sub` → user ID → `Trainer` by `user_id`.

## Behavior (backend)

1. Resolve **trainer** by current user ID (`user_id`).
2. If no trainer record exists → respond with **empty array** `[]`.
3. Load **schedules** where:
   - `trainer_id` = that trainer’s ID  
   - `is_active` = true  
4. Relations loaded: **`service`** (schedule’s service).  
5. Order: **`start_time` ASC**.  
6. Response = **array of schedule objects** (with service).

So the trainer sees **only active** schedules they are assigned to, ordered by class time.

## Response

- **200 OK** – Array of **schedule** objects (each includes **service**). If the user is not a trainer or has no schedules, the array is empty.

### Schedule object (summary)

Same **Schedule** fields as in the customer section. In this endpoint, **service** is loaded, so each schedule typically has a `service` object (id, name, slug, type, duration_minutes, price, etc.). `trainer` is not loaded in this list response.

## Error / edge cases

| Case                     | Response        |
|--------------------------|-----------------|
| Not authenticated        | 401 Unauthorized |
| Authenticated but not TRAINER | 403 Forbidden   |
| No trainer profile       | 200, `[]`       |
| No assigned schedules    | 200, `[]`       |

## Related trainer endpoint: customers in class (for attendance)

**`GET /api/v1/trainer/schedules/:id/customers?date=YYYY-MM-DD`**

- Returns the list of **enrolled customers** for that schedule on the given date (for marking attendance).
- **Rules:**
  - Query param **`date`** is **required** (e.g. `2026-01-24`). If missing → **400 Bad Request**.
  - The schedule **must** belong to the logged-in trainer (`schedule.trainer_id === trainer.id`). If not → **200** with **empty array** `[]`.
- Same data as **`GET /admin/attendance/schedule/:scheduleId/date/:date`** but scoped to the trainer’s own schedule.

Use this to build the “mark attendance” screen for a specific class on a specific date.

---

# Flow Summary

```
Trainer login (TRAINER role)
    → GET /trainer/schedules
    → Backend: user_id → Trainer → schedules where trainer_id = trainer.id and is_active = true
    → 200: Schedule[] (with service)

Trainer: “Who is in my class on this date?”
    → GET /trainer/schedules/:id/customers?date=YYYY-MM-DD
    → Backend: ensure schedule belongs to trainer, then return customers for attendance
    → 200: list of customers + subscription info + attendance status
```

---

# Schedule entity reference (for both flows)

| Column               | Type           | Description |
|----------------------|----------------|-------------|
| `id`                 | number         | Primary key. |
| `service_id`         | number         | Service (e.g. “Morning Yoga”). |
| `trainer_id`         | number         | Assigned trainer. |
| `name`               | string         | Schedule/class name. |
| `recurrence_type`    | enum           | `daily`, `weekly`, `monthly`, `custom`. |
| `monday` … `sunday`  | boolean        | Weekday flags (for weekly). |
| `day_of_month`       | number \| null| Day of month (for monthly). |
| `custom_dates`       | string[] \| null | Custom dates (for custom). |
| `start_time`         | time string    | Class start time. |
| `end_time`           | time string    | Class end time. |
| `effective_from`     | date           | Valid from. |
| `effective_until`    | date \| null   | Valid until. |
| `available_dates`    | string[] \| null | **Computed** list of dates (YYYY-MM-DD) when the schedule runs. Backend calculates from recurrence_type, weekdays, day_of_month/custom_dates, and effective range. |
| `max_participants`   | number         | Max capacity. |
| `current_participants` | number       | Current enrollees. |
| `location`           | string \| null| Location. |
| `meeting_link`       | string \| null| Meeting URL. |
| `is_active`          | boolean        | Active flag. |
| `created_at`         | timestamp      | |
| `updated_at`         | timestamp      | |

**RecurrenceType:** `daily` | `weekly` | `monthly` | `custom`

---

# Frontend checklist

**Customer portal – “My classes”**

1. Call `GET /customer/subscriptions` with credentials. Each subscription includes `schedule` and `service`.
2. Render list of schedules from subscriptions (name, days, time, location, meeting_link, status, session counts).

**Trainer portal – “My classes”**

1. Call `GET /trainer/schedules` with credentials.
2. If 200 and non-empty, render list of schedules (name, service, days, time, location, etc.).
3. For “Mark attendance” for a class on a date: call `GET /trainer/schedules/:id/customers?date=YYYY-MM-DD`, then use the attendance mark endpoints (see SCHEDULE_API_FRONTEND_INTEGRATION.md or PROJECT_FLOW.md) to submit present/absent.
