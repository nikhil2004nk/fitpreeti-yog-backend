# Attendance – Frontend Integration Guide

This document describes how to integrate **attendance** (mark present/absent per schedule + date) in the frontend: list enrolled customers for a class on a date, mark single or bulk attendance, and view customer attendance history.

---

## Overview

| Action | Endpoint | Role |
|--------|----------|------|
| List customers to mark (for a schedule + date) | `GET /admin/attendance/schedule/:scheduleId/date/:date` | Admin, Trainer |
| Mark one customer | `POST /admin/attendance/mark` | Admin, Trainer |
| Mark many customers (bulk) | `POST /admin/attendance/mark/bulk` | Admin, Trainer |
| Customer attendance history | `GET /admin/attendance/customer/:customerId` | Admin, Trainer, Customer |

**Effect of marking present:** The subscription’s `sessions_completed` is incremented (and `sessions_remaining` is updated if `total_sessions` is set). Changing from present → non-present decrements; non-present → present increments.

**Who can mark attendance?**  
Attendance (list and mark) can be done by:
- **Admin** – can list and mark attendance for any schedule.
- **Trainer** – can list and mark attendance (in the trainer portal, show "My classes" from `GET /trainer/schedules`, then use these same list/mark endpoints for those schedules). “My classes” from `GET /trainer/schedules` in the trainer portal, then use these same endpoints
---

## Base URL & Auth

| Setting | Value |
|---------|--------|
| **Base URL** | `http://localhost:3000/api/v1` (or your deployed API URL) |
| **Auth** | Cookie-based JWT (`access_token`) |
| **Credentials** | Include credentials in every request (`credentials: 'include'`) |

**Roles:** All attendance list/mark endpoints allow **ADMIN** and **TRAINER**. Customer attendance history also allows **CUSTOMER** (for own profile).

---

## Attendance status values

Use these exact strings when sending `status`:

| Value | Description |
|-------|-------------|
| `present` | Attended – increments subscription `sessions_completed` |
| `absent` | Did not attend |
| `late` | Attended but late |
| `cancelled` | Class/slot cancelled for this customer |
| `holiday` | Holiday / no class |

**Special:** `not_marked` is returned by the **list** endpoint when no attendance record exists yet; it is **not** a valid value to send in mark requests.

---

## 1. Get customers for attendance (list for a class on a date)

**`GET /api/v1/admin/attendance/schedule/:scheduleId/date/:date`**

Returns the list of **enrolled customers** for that schedule on the given date. Use this to build the “Mark attendance” screen: one row per customer, show current status, then call mark or bulk mark.

### Path parameters

| Param | Type | Description |
|-------|------|-------------|
| `scheduleId` | number | Schedule ID (e.g. from `GET /trainer/schedules` or admin schedules). |
| `date` | string | Date in **YYYY-MM-DD** (e.g. `2026-02-01`). |

### Example

```
GET /api/v1/admin/attendance/schedule/5/date/2026-02-01
```

### Who is included

- Only customers with an **ACTIVE** subscription for this schedule.
- Subscription must be valid on the given date: `starts_on <= date` and (`ends_on` is null or `ends_on >= date`).
- Sorted by customer `full_name`.

### Response: 200 OK

Array of objects:

```ts
{
  customer_id: number;
  full_name: string;
  phone: string | null;
  subscription_id: number;
  sessions_completed: number;
  sessions_remaining: number | null;
  attendance_status: string;   // 'present' | 'absent' | 'late' | 'cancelled' | 'holiday' | 'not_marked'
  attendance_id: number | null; // set when already marked; use for updates
}
```

| Field | Description |
|-------|-------------|
| `customer_id` | Customer ID. |
| `full_name` | Display name. |
| `phone` | Customer phone (optional). |
| `subscription_id` | **Required for mark/bulk** – use this in mark requests. |
| `sessions_completed` | Sessions used so far (from subscription). |
| `sessions_remaining` | Remaining sessions (if subscription has `total_sessions`). |
| `attendance_status` | Current status for this date; `not_marked` if no record yet. |
| `attendance_id` | Existing attendance record ID (null if not marked yet). |

### Errors

| Code | When |
|------|------|
| 401 | Not authenticated. |
| 403 | Not Admin or Trainer. |

**Trainer note:** For trainer portal, you can use the same URL. Backend allows TRAINER; ensure the schedule belongs to the logged-in trainer (e.g. only show schedules from `GET /trainer/schedules`).

---

## 2. Mark attendance (single)

**`POST /api/v1/admin/attendance/mark`**

Mark one customer as present/absent/late/cancelled/holiday for a given schedule and date.

### Request body

```json
{
  "customer_id": 10,
  "schedule_id": 5,
  "subscription_id": 7,
  "attendance_date": "2026-02-01",
  "status": "present",
  "notes": "Optional note"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | number | ✅ | Customer ID (from list response). |
| `schedule_id` | number | ✅ | Schedule ID. |
| `subscription_id` | number | ✅ | Subscription ID (from list response). |
| `attendance_date` | string | ✅ | Date **YYYY-MM-DD**. |
| `status` | enum | ✅ | `present` \| `absent` \| `late` \| `cancelled` \| `holiday`. |
| `notes` | string | No | Optional note. |

### Response

- **200 OK** – Single attendance entity (e.g. `id`, `customer_id`, `schedule_id`, `subscription_id`, `attendance_date`, `status`, `notes`, `marked_by`, `marked_at`, `updated_at`).

### Backend behavior

- If no record exists for (customer, schedule, date): creates one. If `status === 'present'`, increments subscription `sessions_completed` (and updates `sessions_remaining` if applicable).
- If a record exists: updates status (and optional notes). If status changes from present → non-present, decrements `sessions_completed`; from non-present → present, increments it.

### Errors

| Code | When |
|------|------|
| 400 | Validation error (invalid body or status). |
| 401 | Not authenticated. |
| 403 | Not Admin or Trainer. |

---

## 3. Mark attendance (bulk)

**`POST /api/v1/admin/attendance/mark/bulk`**

Mark multiple customers for the **same** schedule and date in one request.

### Request body

```json
{
  "schedule_id": 5,
  "attendance_date": "2026-02-01",
  "marks": [
    { "customer_id": 10, "subscription_id": 7, "status": "present" },
    { "customer_id": 11, "subscription_id": 8, "status": "absent" },
    { "customer_id": 12, "subscription_id": 9, "status": "present", "notes": "On time" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule_id` | number | ✅ | Schedule ID (same for all). |
| `attendance_date` | string | ✅ | Date **YYYY-MM-DD** (same for all). |
| `marks` | array | ✅ | At least one item. |
| `marks[].customer_id` | number | ✅ | Customer ID. |
| `marks[].subscription_id` | number | ✅ | Subscription ID for that customer. |
| `marks[].status` | enum | ✅ | `present` \| `absent` \| `late` \| `cancelled` \| `holiday`. |
| `marks[].notes` | string | No | Optional note for that row. |

### Response

- **200 OK** – Array of attendance entities (same shape as single mark), in the same order as `marks`.

### Backend behavior

- Processes each item in `marks` like a single mark (create or update, and adjust `sessions_completed` when status is or was `present`).

### Errors

| Code | When |
|------|------|
| 400 | Validation error (e.g. empty `marks`, invalid status). |
| 401 | Not authenticated. |
| 403 | Not Admin or Trainer. |

---

## 4. Customer attendance history

**`GET /api/v1/admin/attendance/customer/:customerId`**

Returns attendance records for a customer (optionally filtered by date range). Use for admin/trainer reports or for the customer’s own “My attendance” page.

### Path parameters

| Param | Type | Description |
|-------|------|-------------|
| `customerId` | number | Customer ID. |

### Query parameters

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string | Optional. Filter: attendance_date >= startDate (YYYY-MM-DD). |
| `endDate` | string | Optional. Filter: attendance_date <= endDate (YYYY-MM-DD). |

### Example

```
GET /api/v1/admin/attendance/customer/10?startDate=2026-01-01&endDate=2026-01-31
```

### Response: 200 OK

Array of **attendance** entities with relations, e.g.:

- `id`, `customer_id`, `schedule_id`, `subscription_id`, `attendance_date`, `status`, `notes`, `check_in_time`, `check_out_time`, `marked_by`, `marked_at`, `updated_at`
- `schedule` (and possibly `schedule.service`)
- `markedByUser` (user who marked)

Ordered by `attendance_date` DESC.

### Roles

- **ADMIN / TRAINER:** Can pass any `customerId`.
- **CUSTOMER:** Should only call with their **own** customer ID (resolve from `GET /customer/profile` then use `customer.id`). Backend allows CUSTOMER role; enforce in UI that customers only request their own ID.

### Errors

| Code | When |
|------|------|
| 401 | Not authenticated. |
| 403 | Role not allowed. |

---

## Frontend flow: “Mark attendance” screen

1. **Choose schedule and date**  
   - Admin: from `GET /admin/schedules`.  
   - Trainer: from `GET /trainer/schedules`.

2. **Load list**  
   - `GET /admin/attendance/schedule/:scheduleId/date/:date`  
   - Store `customer_id`, `subscription_id`, `attendance_status`, `attendance_id` for each row.

3. **Render table**  
   - One row per customer: name, phone, sessions_completed, sessions_remaining, current status.  
   - Dropdown or buttons: Present / Absent / Late / Cancelled / Holiday.

4. **Submit**  
   - **Option A:** On each row change, call `POST /admin/attendance/mark` (single).  
   - **Option B:** “Save all” button: collect changed rows and call `POST /admin/attendance/mark/bulk` with one object per changed customer (same `schedule_id` and `attendance_date`).

5. **Refresh (optional)**  
   - Call the GET list again to get updated `sessions_completed`, `sessions_remaining`, and `attendance_status` after marking.

---

## Session count rules (for UI)

- **Mark as present:** Subscription `sessions_completed` +1; `sessions_remaining` = `total_sessions - sessions_completed` (if subscription has `total_sessions`).
- **Change present → absent/late/cancelled/holiday:** `sessions_completed` -1 (and `sessions_remaining` updated accordingly).
- **Change absent/late/etc. → present:** Same as “mark as present”.
- **Not present ↔ not present:** No change to session counts.

You can refetch the list after mark/bulk to show updated counts, or derive from the returned attendance payload if your API returns subscription data.

---

## TypeScript / type hints

```ts
// Status values you can send
type AttendanceStatus = 'present' | 'absent' | 'late' | 'cancelled' | 'holiday';

// List response item
interface CustomerForAttendance {
  customer_id: number;
  full_name: string;
  phone: string | null;
  subscription_id: number;
  sessions_completed: number;
  sessions_remaining: number | null;
  attendance_status: AttendanceStatus | 'not_marked';
  attendance_id: number | null;
}

// Single mark body
interface MarkAttendanceBody {
  customer_id: number;
  schedule_id: number;
  subscription_id: number;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

// Bulk mark body
interface BulkMarkAttendanceBody {
  schedule_id: number;
  attendance_date: string; // YYYY-MM-DD
  marks: {
    customer_id: number;
    subscription_id: number;
    status: AttendanceStatus;
    notes?: string;
  }[];
}
```

---

## Quick reference

| Goal | Method | URL / Body |
|------|--------|------------|
| List customers to mark | GET | `/api/v1/admin/attendance/schedule/:scheduleId/date/:date` |
| Mark one | POST | `/api/v1/admin/attendance/mark` + body above |
| Mark many | POST | `/api/v1/admin/attendance/mark/bulk` + body above |
| Customer history | GET | `/api/v1/admin/attendance/customer/:customerId?startDate=&endDate=` |

All requests: cookie JWT, `credentials: 'include'`. List/mark: Admin or Trainer. History: Admin, Trainer, or Customer (own ID only in UI).
