# Fitpreeti Yog Backend – Full Project Flow

This document describes the end-to-end flow from **onboarding a customer** through **schedules**, **subscriptions**, and **attendance**.

---

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LEADS (inquiry)                                                                  │
│  POST /leads  (public)                                                            │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ADMIN: Convert lead → Customer (onboarding)                                      │
│  PUT /admin/leads/:id (status: converted)  OR  POST /admin/leads/:id/convert      │
│  → Customer created with status ONBOARDING, linked to lead                        │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER ONBOARDING                                                              │
│  Option A: Admin creates customer directly  POST /admin/customers (with/without   │
│            password → ACTIVE or ONBOARDING)                                       │
│  Option B: Complete onboarding for existing customer                              │
│            POST /admin/customers/:id/complete-onboarding (email + password)       │
│  → Customer gets user_id, status ACTIVE, onboarded_at set                         │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SCHEDULES (Admin creates classes)                                                │
│  POST /admin/schedules  (service_id, trainer_id, name, recurrence, days,         │
│                         start_time, end_time, effective_from/until,               │
│                         max_participants, location, meeting_link)                 │
│  GET  /admin/schedules?activeOnly=true                                            │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SUBSCRIPTION (Admin enrolls customer in a schedule)                              │
│  POST /admin/subscriptions  (customer_id, schedule_id, service_id, starts_on,      │
│                             ends_on?, total_sessions?, amount_paid?, payment_*)  │
│  → One customer can have one active subscription per schedule                    │
│  → current_participants on schedule is updated                                    │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER / TRAINER see their schedules                                           │
│  Customer: GET /customer/schedules  (schedules from their active subscriptions)   │
│  Trainer:  GET /trainer/schedules   (schedules where they are assigned)           │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ATTENDANCE (mark present/absent per schedule + date)                              │
│  GET  /admin/attendance/schedule/:scheduleId/date/:date  → list enrolled customers │
│  POST /admin/attendance/mark       (single: customer_id, schedule_id,             │
│                                     subscription_id, attendance_date, status)    │
│  POST /admin/attendance/mark/bulk  (bulk marks)                                   │
│  Status: present | absent | late | cancelled | holiday                            │
│  → On PRESENT: subscription.sessions_completed incremented, sessions_remaining     │
│    updated if total_sessions is set                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Leads (Inquiry / Prospect)

| What | Description |
|------|-------------|
| **Entity** | `Lead` – name, email, phone, interested_in, preferred_class_type, experience_level, goals, health_conditions, source, status, etc. |
| **Create (public)** | `POST /leads` – e.g. website form. No auth. |
| **Admin** | `GET /admin/leads`, `GET /admin/leads/:id`, `PUT /admin/leads/:id`, add activity, **convert** to customer. |
| **Convert** | `PUT /admin/leads/:id` with `status: "converted"` or dedicated convert endpoint → creates **Customer** from lead (status `ONBOARDING`, `lead_id` set). |

**Flow:** Visitor fills form → Lead created → Admin nurtures → Admin marks lead **converted** → Customer record created (onboarding).

---

## 2. Customer Onboarding

| What | Description |
|------|-------------|
| **Entity** | `Customer` – full_name, email, phone, address, emergency contact, medical/allergies, yoga_experience_level, preferred_class_type, membership_status, status (`ONBOARDING` \| `ACTIVE`), `user_id`, `lead_id`, `onboarded_at`. |
| **Ways to create** | (1) From lead (automatic on convert). (2) Direct: `POST /admin/customers` with body. |
| **Direct create** | If `user_id` is sent → link existing user. If not: with **email + password (≥8 chars)** → create User (role CUSTOMER), set `user_id`, status `ACTIVE`, `onboarded_at`. Without password → status `ONBOARDING`, no login yet. |
| **Complete onboarding** | For customer in ONBOARDING: `POST /admin/customers/:id/complete-onboarding` with `{ email, password }` → creates User, sets `user_id`, status `ACTIVE`, `onboarded_at`. |
| **List/update** | `GET /admin/customers`, `GET /admin/customers/:id`, `PUT /admin/customers/:id`. |

**Flow:** Customer exists (from lead or direct). If ONBOARDING → complete onboarding with email + password → customer can log in and use customer portal.

---

## 3. Schedules (Recurring Classes)

| What | Description |
|------|-------------|
| **Entity** | `Schedule` – service_id, trainer_id, name, recurrence_type (daily/weekly/monthly/custom), monday–sunday, start_time, end_time, effective_from, effective_until, max_participants, current_participants, location, meeting_link, is_active. |
| **Create** | `POST /admin/schedules` – Admin creates a class and assigns a **service** and **trainer**. |
| **List/one** | `GET /admin/schedules`, `GET /admin/schedules?activeOnly=true`, `GET /admin/schedules/:id`. |
| **Update / deactivate** | `PUT /admin/schedules/:id`, `DELETE /admin/schedules/:id` (deactivate). |

**Flow:** Admin defines which classes run when (e.g. “Morning Yoga” Mon/Wed/Fri 9–10, effective Feb–Dec). Trainers see their schedules; customers see schedules only **through subscriptions**.

---

## 4. Subscriptions (Enroll Customer in a Schedule)

| What | Description |
|------|-------------|
| **Entity** | `CustomerSubscription` – customer_id, schedule_id, service_id, starts_on, ends_on, total_sessions, sessions_completed, sessions_remaining, amount_paid, payment_status, status (e.g. ACTIVE/CANCELLED), pause dates. |
| **Rule** | One active subscription per (customer, schedule). |
| **Create** | `POST /admin/subscriptions` – body: `customer_id`, `schedule_id`, `service_id`, `starts_on`, optional `ends_on`, `total_sessions`, `amount_paid`, `payment_status`. Schedule’s `current_participants` is incremented. |
| **List** | `GET /admin/subscriptions?customer_id=&schedule_id=&status=`. |
| **Update / cancel** | `PUT /admin/subscriptions/:id`, `POST /admin/subscriptions/:id/cancel` (optionally with reason). |

**Flow:** Customer is enrolled in a **schedule**. They see that schedule in the customer portal (`GET /customer/schedules`). Sessions used are tracked via **attendance** (sessions_completed / sessions_remaining).

---

## 5. Bookings (One-Off Service Bookings) – Separate Path

Your app also has **bookings**, which are **different** from subscriptions:

| What | Description |
|------|-------------|
| **Entity** | `Booking` – user_id, service_id, booking_date, booking_time, full_name, email, phone, status, payment_status, amount. Identified by **user** (via phone). |
| **Use case** | One-off session: user picks a **service**, **date**, and **time slot**. No schedule/recurrence. |
| **Endpoints** | `POST /bookings` (auth by cookie, user from phone), `GET /bookings`, `GET /bookings/available/:serviceId/:date`, `GET /bookings/admin/all`, etc. |

So you have **two** ways to “book”:

- **Subscription** = customer enrolled in a **recurring schedule** (used for class attendance and present/absent).
- **Booking** = one-off **service + date + time** for a user (by phone); not tied to schedules or attendance.

---

## 6. Attendance (Present / Absent per Schedule + Date)

| What | Description |
|------|-------------|
| **Entity** | `Attendance` – customer_id, schedule_id, subscription_id, attendance_date, status (present \| absent \| late \| cancelled \| holiday), check_in_time, check_out_time, notes, marked_by (user id). Unique per (customer, schedule, date). |
| **Who can mark** | Admin and Trainer (cookie JWT + role). |
| **Get list for a class on a date** | `GET /admin/attendance/schedule/:scheduleId/date/:date` – returns enrolled customers (from **active subscriptions** for that schedule valid on that date) with current attendance_status and subscription session counts. |
| **Mark one** | `POST /admin/attendance/mark` – body: customer_id, schedule_id, subscription_id, attendance_date, status, optional notes. |
| **Mark many** | `POST /admin/attendance/mark/bulk` – schedule_id, attendance_date, and array of { customer_id, subscription_id, status, notes }. |
| **Effect of “present”** | Subscription’s `sessions_completed` is incremented; `sessions_remaining` is updated if `total_sessions` is set. Changing from present → non-present decrements; non-present → present increments. |
| **Customer history** | `GET /admin/attendance/customer/:customerId?startDate=&endDate=` – attendance history for that customer. |

**Flow:** For a given **schedule** and **date**, admin/trainer opens the attendance screen → API returns enrolled customers → they set each to present/absent/late/etc. → on **present**, subscription session counts update automatically.

---

## 7. Customer Portal (Logged-In Customer)

| Endpoint | Description |
|----------|-------------|
| `GET /customer/profile` | My customer profile. |
| `PUT /customer/profile` | Update my profile. |
| `GET /customer/subscriptions` | My subscriptions (which schedules I’m in). |
| `GET /customer/schedules` | Schedules derived from my subscriptions. |
| `GET /customer/attendance?startDate=&endDate=` | My attendance history. |

All require **CUSTOMER** role (JWT from login created at onboarding).

---

## 8. Trainer Portal

| Endpoint | Description |
|----------|-------------|
| `GET /trainer/schedules` | Schedules where I am the assigned trainer. |
| `GET /trainer/schedules/:id/customers?date=YYYY-MM-DD` | For one of my schedules, list customers to mark attendance for that date (same data as admin attendance list for that schedule+date). |

Trainer can then call the same **attendance mark** endpoints to mark present/absent.

---

## 9. End-to-End Summary (Recurring Class Path)

1. **Lead** – Created via `POST /leads` (e.g. website).
2. **Customer** – Admin converts lead (`PUT /admin/leads/:id` status converted) or creates customer directly (`POST /admin/customers`). If onboarding: `POST /admin/customers/:id/complete-onboarding` with email + password.
3. **Schedule** – Admin creates class: `POST /admin/schedules` (service + trainer + days/times).
4. **Subscription** – Admin enrolls customer in schedule: `POST /admin/subscriptions` (customer_id, schedule_id, service_id, starts_on, etc.).
5. **Attendance** – For each class date: `GET /admin/attendance/schedule/:scheduleId/date/:date` → then `POST /admin/attendance/mark` or `mark/bulk` to set **present** or **absent** (or late/cancelled/holiday). Present updates subscription session counts.

**Bookings** are a separate, one-off service booking flow (user + service + date + time); they do not drive schedules or attendance.

---

## 10. Roles and Auth

- **Public:** `POST /leads` only.
- **Admin:** Customers, schedules, subscriptions, attendance, leads management. Cookie JWT + role `ADMIN`.
- **Trainer:** Own schedules, attendance for those schedules (get list + mark). Cookie JWT + role `TRAINER`.
- **Customer:** Profile, my subscriptions, my schedules, my attendance. Cookie JWT + role `CUSTOMER` (created when onboarding is completed).

Base URL: `http://localhost:3000/api/v1` (or your deployed API). Send credentials (cookies) with each authenticated request.
