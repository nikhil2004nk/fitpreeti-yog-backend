# Schedule API – Frontend Integration Guide

This document describes how to integrate the schedule and attendance APIs in the Fitpreeti Yog frontend.

## Flow Overview

```
Admin creates schedules → Assigns trainers
         ↓
Trainer sees their assigned schedules
         ↓
Customer sees their schedules (from subscriptions)
         ↓
Attendance is marked based on schedule (Admin & Trainer)
```

---

## Base URL & Auth

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:3000/api/v1` (dev) or your deployed API URL |
| **Auth** | Cookie-based JWT (`access_token`) |
| **Credentials** | Include credentials in requests (`credentials: 'include'`) |

All endpoints require an authenticated user. Ensure cookies are sent with each request.

---

## Admin Endpoints

### 1. Create Schedule

**`POST /api/v1/admin/schedules`**

Create a new schedule and assign a trainer.

**Request Body:**

```json
{
  "service_id": 1,
  "trainer_id": 1,
  "name": "Morning Yoga Class",
  "recurrence_type": "weekly",
  "monday": true,
  "tuesday": false,
  "wednesday": true,
  "thursday": false,
  "friday": false,
  "saturday": true,
  "sunday": false,
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "effective_from": "2026-02-01",
  "effective_until": "2026-12-31",
  "max_participants": 20,
  "location": "Main Hall",
  "meeting_link": "https://meet.example.com/yoga",
  "is_active": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_id` | number | ✅ | Service ID |
| `trainer_id` | number | ✅ | Trainer ID |
| `name` | string | ✅ | Schedule name (max 255) |
| `recurrence_type` | enum | ✅ | `daily`, `weekly`, `monthly`, `custom` |
| `monday`–`sunday` | boolean | optional | Days of week (for weekly) |
| `day_of_month` | number | optional | Day of month (for monthly, 1–31) |
| `custom_dates` | string[] | optional | Custom dates for `custom` recurrence |
| `start_time` | string | ✅ | Time (e.g. `"09:00:00"`) |
| `end_time` | string | ✅ | Time (e.g. `"10:00:00"`) |
| `effective_from` | string | ✅ | Start date (YYYY-MM-DD) |
| `effective_until` | string | optional | End date (YYYY-MM-DD) |
| `max_participants` | number | ✅ | Max participants (min 1) |
| `location` | string | optional | Location (max 500) |
| `meeting_link` | string | optional | Meeting URL (max 500) |
| `is_active` | boolean | optional | Default `true` |

**Response:** `201` – Created schedule object.

---

### 2. List All Schedules

**`GET /api/v1/admin/schedules`**

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `activeOnly` | string | `"true"` to return only active schedules |

**Example:** `GET /api/v1/admin/schedules?activeOnly=true`

**Response:** `200` – Array of schedules (with `service`, `trainer`, `trainer.user` relations).

---

### 3. Get Schedule by ID

**`GET /api/v1/admin/schedules/:id`**

**Response:** `200` – Schedule object.

---

### 4. Update Schedule

**`PUT /api/v1/admin/schedules/:id`**

**Request Body:** Same shape as Create Schedule (all fields optional for update).

**Response:** `200` – Updated schedule object.

---

### 5. Cancel / Deactivate Schedule

**`DELETE /api/v1/admin/schedules/:id`**

**Response:** `200` – Success.

---

### 6. Get Customers for Attendance

**`GET /api/v1/admin/attendance/schedule/:scheduleId/date/:date`**

Get list of enrolled customers for a schedule on a given date (for marking attendance).

| Param | Description |
|-------|-------------|
| `scheduleId` | Schedule ID |
| `date` | Date in `YYYY-MM-DD` |

**Example:** `GET /api/v1/admin/attendance/schedule/5/date/2026-01-31`

**Response:** Array of:

```ts
{
  customer_id: number;
  full_name: string;
  phone: string | null;
  subscription_id: number;
  sessions_completed: number;
  sessions_remaining: number | null;
  attendance_status: string;  // e.g. "present", "absent", "not_marked"
  attendance_id: number | null;
}
```

---

### 7. Mark Attendance (Single)

**`POST /api/v1/admin/attendance/mark`**

**Request Body:**

```json
{
  "customer_id": 1,
  "schedule_id": 5,
  "subscription_id": 10,
  "attendance_date": "2026-01-31",
  "status": "present",
  "notes": "Optional note"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | number | ✅ | Customer ID |
| `schedule_id` | number | ✅ | Schedule ID |
| `subscription_id` | number | ✅ | Subscription ID |
| `attendance_date` | string | ✅ | YYYY-MM-DD |
| `status` | enum | ✅ | `present`, `absent`, `late`, `cancelled`, `holiday` |
| `notes` | string | optional | Optional note |

**Response:** `201` – Attendance record.

---

### 8. Mark Attendance (Bulk)

**`POST /api/v1/admin/attendance/mark/bulk`**

**Request Body:**

```json
{
  "schedule_id": 5,
  "attendance_date": "2026-01-31",
  "marks": [
    {
      "customer_id": 1,
      "subscription_id": 10,
      "status": "present",
      "notes": null
    },
    {
      "customer_id": 2,
      "subscription_id": 11,
      "status": "absent"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule_id` | number | ✅ | Schedule ID |
| `attendance_date` | string | ✅ | YYYY-MM-DD |
| `marks` | array | ✅ | At least one item |
| `marks[].customer_id` | number | ✅ | Customer ID |
| `marks[].subscription_id` | number | ✅ | Subscription ID |
| `marks[].status` | enum | ✅ | `present`, `absent`, `late`, `cancelled`, `holiday` |
| `marks[].notes` | string | optional | Optional note |

**Response:** `201` – Bulk result.

---

### 9. Get Customer Attendance History

**`GET /api/v1/admin/attendance/customer/:customerId`**

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string | Optional filter (YYYY-MM-DD) |
| `endDate` | string | Optional filter (YYYY-MM-DD) |

**Example:** `GET /api/v1/admin/attendance/customer/3?startDate=2026-01-01&endDate=2026-01-31`

**Response:** `200` – Array of attendance records.

---

## Trainer Endpoints

### 1. My Schedules

**`GET /api/v1/trainer/schedules`**

Returns schedules assigned to the logged-in trainer.

**Response:** `200` – Array of schedule objects.

---

### 2. Customers in My Class

**`GET /api/v1/trainer/schedules/:id/customers?date=YYYY-MM-DD`**

Get enrolled customers for a specific schedule on a given date. Only returns data if the schedule belongs to the trainer.

| Param | Description |
|-------|-------------|
| `id` | Schedule ID |
| `date` | Required query param – YYYY-MM-DD |

**Example:** `GET /api/v1/trainer/schedules/5/customers?date=2026-01-31`

**Response:** Same shape as Admin “Get Customers for Attendance”.

---

### 3. Attendance (Admin endpoints with Trainer role)

Trainers can also use:

- `GET /api/v1/admin/attendance/schedule/:scheduleId/date/:date` – Get customers for attendance
- `POST /api/v1/admin/attendance/mark` – Mark single attendance
- `POST /api/v1/admin/attendance/mark/bulk` – Bulk mark attendance

---

## Customer Endpoints

### 1. My Attendance History

**`GET /api/v1/customer/attendance`**

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string | Optional (YYYY-MM-DD) |
| `endDate` | string | Optional (YYYY-MM-DD) |

**Example:** `GET /api/v1/customer/attendance?startDate=2026-01-01&endDate=2026-01-31`

**Response:** `200` – Array of the customer’s attendance records.

---

## Enums Reference

### RecurrenceType

```ts
type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';
```

### AttendanceStatus

```ts
type AttendanceStatus = 'present' | 'absent' | 'late' | 'cancelled' | 'holiday';
```

---

## Quick Reference Table

| Role | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| Admin | POST | `admin/schedules` | Create schedule, assign trainer |
| Admin | GET | `admin/schedules` | List all schedules |
| Admin | GET | `admin/schedules/:id` | Get schedule by ID |
| Admin | PUT | `admin/schedules/:id` | Update schedule |
| Admin | DELETE | `admin/schedules/:id` | Cancel/deactivate schedule |
| Admin | GET | `admin/attendance/schedule/:scheduleId/date/:date` | Get customers for attendance |
| Admin | POST | `admin/attendance/mark` | Mark attendance |
| Admin | POST | `admin/attendance/mark/bulk` | Bulk mark attendance |
| Admin | GET | `admin/attendance/customer/:customerId` | Get attendance history |
| Trainer | GET | `trainer/schedules` | My schedules |
| Trainer | GET | `trainer/schedules/:id/customers?date=YYYY-MM-DD` | Customers in my class |
| Trainer | GET | `admin/attendance/schedule/:scheduleId/date/:date` | Get customers for attendance |
| Trainer | POST | `admin/attendance/mark` | Mark attendance |
| Trainer | POST | `admin/attendance/mark/bulk` | Bulk mark attendance |
| Customer | GET | `customer/subscriptions` | My subscriptions (each includes schedule + service) |
| Customer | GET | `customer/attendance` | My attendance history |

---

## Example: Fetch with Credentials

```ts
const BASE = 'http://localhost:3000/api/v1';

// List schedules (Admin)
const schedules = await fetch(`${BASE}/admin/schedules?activeOnly=true`, {
  credentials: 'include',
});

// My schedules (Trainer)
const mySchedules = await fetch(`${BASE}/trainer/schedules`, {
  credentials: 'include',
});

// Mark attendance (Admin/Trainer)
await fetch(`${BASE}/admin/attendance/mark`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_id: 1,
    schedule_id: 5,
    subscription_id: 10,
    attendance_date: '2026-01-31',
    status: 'present',
  }),
});
```

---

## Error Responses

- `401` – Unauthorized (not logged in or invalid token)
- `403` – Forbidden (role not allowed for this endpoint)
- `404` – Resource not found
- `400` – Bad request (validation error)

Ensure the frontend sends `credentials: 'include'` for all API calls so the JWT cookie is included.
