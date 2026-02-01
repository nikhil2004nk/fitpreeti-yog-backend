# Project Analysis: Unused / Extra Entities, Tables & Files

> **CLEANUP COMPLETED** – The items below have been removed from the project.

## Executive Summary

Several database tables (entities) and files existed in the project but were **never used** by any business logic, controller, or service. These have been removed.

---

## 1. UNUSED ENTITIES (Tables with no business logic)

### 1.1 `notifications` table / `Notification` entity
- **Location:** `src/notifications/entities/notification.entity.ts`
- **Status:** Table is in DB, but **no module, service, or controller** uses it
- **Used by:** Only `database.module.ts` (entity registration)
- **Recommendation:** Remove if you don't plan notifications soon. Otherwise keep for future implementation.

### 1.2 `audit_logs` table / `AuditLog` entity
- **Location:** `src/audit/entities/audit-log.entity.ts`
- **Status:** Table is in DB, but **no module, service, or controller** uses it
- **Used by:** Only `database.module.ts` (entity registration)
- **Recommendation:** Remove if you don't need audit trails. Otherwise implement an AuditService to log actions.

### 1.3 `schedule_exceptions` table / `ScheduleException` entity
- **Location:** `src/schedules/entities/schedule-exception.entity.ts`
- **Status:** Table is in DB, but **SchedulesModule doesn't even import it**
- **Used by:** Only `database.module.ts`. Schedule entity has no relation to it.
- **Recommendation:** Remove if you don't plan to support schedule exceptions (holidays, cancellations). Schedules use `available_dates` JSON instead.

### 1.4 `app_settings` table / `AppSetting` entity
- **Location:** `src/app-settings/entities/app-setting.entity.ts`
- **Status:** Seeded by `seed.service.ts`, but **no API to read or update** settings
- **Used by:** `seed.service.ts` only (inserts: site_name, max_leads_per_day, enable_online_payment, working_hours)
- **Recommendation:** Either implement `AppSettingsModule` + controller to expose settings via API, or remove if you don't need dynamic config.

---

## 2. UNUSED FILES (Dead code)

### 2.1 Attendance DTOs (old design, never used)
- `src/attendance/dto/create-attendance.dto.ts` – Uses `user_id` (UUID), different from current `MarkAttendanceDto`
- `src/attendance/dto/update-attendance.dto.ts`
- `src/attendance/dto/bulk-create-attendance.dto.ts` – Uses `user_ids[]`, not `marks[]`
- `src/attendance/dto/index.ts` – Exports the above; only `mark-attendance.dto` is used by `AttendanceController`
- **Recommendation:** Delete these 4 files. The controller uses `MarkAttendanceDto` and `BulkMarkAttendanceDto` from `mark-attendance.dto.ts`.

### 2.2 `TrainerSpecialization` enum
- **Location:** `src/trainers/enums/trainer-specialization.enum.ts`
- **Status:** Never imported or used
- **Note:** `Trainer` entity uses `specialization: string` (free text), not this enum
- **Recommendation:** Remove if not planned for use.

---

## 3. ENTITIES THAT ARE USED (for reference)

| Entity | Used by |
|--------|---------|
| User | Auth, Users, Customers, Trainers |
| PasswordResetToken | Auth |
| UserSession | Auth (SessionService) |
| Trainer | Trainers, Schedules, Dashboard |
| TrainerAvailability | Trainers |
| Service | Services, Schedules, ClassBookings |
| ServiceOption | Services, Seed |
| Lead | Leads, Dashboard |
| LeadActivity | Leads |
| Customer | Customers, ClassBookings, Payments, Dashboard |
| Schedule | Schedules, ClassBookings, Attendance |
| ClassBooking | ClassBookings, Subscriptions, Attendance |
| CustomerSubscription | Subscriptions |
| Attendance | Attendance |
| Payment | Payments, Subscriptions, Dashboard |
| Review | Reviews, Seed |
| InstituteInfo | InstituteInfo, Seed |
| ContentSection | ContentSections |

---

## 4. MODULES SUMMARY

| Module | Status |
|--------|--------|
| Notifications | **No module** – only entity folder |
| Audit | **No module** – only entity folder |
| AppSettings | **No module** – only entity folder (used in Seed) |

---

## 5. RECOMMENDED ACTIONS

### Safe to remove (if not planned)
1. **Attendance DTOs:** `create-attendance.dto.ts`, `update-attendance.dto.ts`, `bulk-create-attendance.dto.ts`, and update `index.ts`
2. **TrainerSpecialization enum:** `trainer-specialization.enum.ts`

### Consider removing entities (drop tables via migration or sync)
- `Notification` – if no notifications feature planned
- `AuditLog` – if no audit logging planned
- `ScheduleException` – if schedule exceptions are not used
- `AppSetting` – only if you won't expose settings via API (seed will need adjustment)

### Consider implementing
- **AppSettingsModule** – if you want configurable settings (site name, etc.) via API
- **NotificationsModule** – if you plan push/email notifications
- **AuditModule** – if you need action logging
