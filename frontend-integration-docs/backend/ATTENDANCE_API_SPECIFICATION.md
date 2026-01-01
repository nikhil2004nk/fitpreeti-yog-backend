# Attendance System API Specification

## Overview

This document specifies the API requirements for the Attendance Management System. The system allows customers and trainers to mark their own attendance, while admins can manage attendance for all users with advanced filtering and bulk operations.

**Base URL:** `http://localhost:3000/api/v1` (or as configured via `VITE_API_BASE_URL`)

**Authentication:** All endpoints require authentication via cookies (JWT tokens). The frontend uses `credentials: 'include'` for cookie-based authentication.

---

## Data Models

### Attendance

```typescript
interface Attendance {
  id: string;                    // Unique attendance record ID
  user_id: string;                // ID of the user (customer/trainer)
  user_name?: string;             // Name of the user (for display)
  user_role?: 'customer' | 'admin' | 'trainer';  // Role of the user
  date: string;                   // Date in ISO format (YYYY-MM-DD)
  status: 'present' | 'absent';   // Attendance status
  marked_by?: string;             // User ID who marked the attendance (null if self-marked)
  marked_by_name?: string;        // Name of the person who marked attendance
  notes?: string;                 // Optional notes
  created_at?: string;            // ISO timestamp
  updated_at?: string;            // ISO timestamp
}
```

### Create Attendance Data

```typescript
interface CreateAttendanceData {
  user_id: string;                // Required: User ID
  date: string;                   // Required: Date in YYYY-MM-DD format
  status: 'present' | 'absent';   // Required: Attendance status
  notes?: string;                 // Optional: Notes
}
```

### Update Attendance Data

```typescript
interface UpdateAttendanceData {
  status?: 'present' | 'absent';  // Optional: New status
  notes?: string;                 // Optional: Updated notes
}
```

### Attendance Filter

```typescript
interface AttendanceFilter {
  user_id?: string;               // Filter by specific user ID
  user_role?: 'customer' | 'admin' | 'trainer';  // Filter by role
  start_date?: string;            // Start date for range (YYYY-MM-DD)
  end_date?: string;              // End date for range (YYYY-MM-DD)
  status?: 'present' | 'absent';  // Filter by status
}
```

### Attendance Statistics

```typescript
interface AttendanceStats {
  total_days: number;             // Total days in the period
  present_days: number;           // Number of present days
  absent_days: number;            // Number of absent days
  attendance_percentage: number;  // Percentage (0-100)
}
```

---

## API Endpoints

### 1. Mark Own Attendance

**Endpoint:** `POST /attendance/mark`

**Description:** Allows customers and trainers to mark their own attendance for a specific date.

**Authentication:** Required (Customer or Trainer role)

**Request Body:**
```json
{
  "date": "2024-01-15",
  "status": "present",
  "notes": "Optional notes here"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "id": "att_123",
    "user_id": "user_456",
    "user_name": "John Doe",
    "user_role": "customer",
    "date": "2024-01-15",
    "status": "present",
    "marked_by": null,
    "marked_by_name": null,
    "notes": "Optional notes here",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Business Logic:**
- User can only mark their own attendance
- If attendance already exists for the date, it should be updated (or return error with option to update)
- `marked_by` should be `null` for self-marked attendance
- Date must be in YYYY-MM-DD format
- Status must be either 'present' or 'absent'

**Error Responses:**
- `400 Bad Request`: Invalid date format
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't have permission (e.g., admin trying to use this endpoint)
- `409 Conflict`: Attendance already exists for this date (if not allowing updates)

---

### 2. Get Own Attendance

**Endpoint:** `GET /attendance/own`

**Description:** Retrieves attendance records for the authenticated user.

**Authentication:** Required (Customer or Trainer role)

**Query Parameters:**
- `start_date` (optional): Filter from this date (YYYY-MM-DD)
- `end_date` (optional): Filter until this date (YYYY-MM-DD)

**Example:** `GET /attendance/own?start_date=2024-01-01&end_date=2024-01-31`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "att_123",
      "user_id": "user_456",
      "user_name": "John Doe",
      "user_role": "customer",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": null,
      "marked_by_name": null,
      "notes": "On time",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Business Logic:**
- Only returns attendance records for the authenticated user
- If no date filters provided, return all records
- Results should be sorted by date (newest first or oldest first - specify preference)

---

### 3. Mark Attendance for User (Admin)

**Endpoint:** `POST /attendance`

**Description:** Allows admin to mark attendance for any user.

**Authentication:** Required (Admin role only)

**Request Body:**
```json
{
  "user_id": "user_456",
  "date": "2024-01-15",
  "status": "present",
  "notes": "Marked by admin"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "id": "att_123",
    "user_id": "user_456",
    "user_name": "John Doe",
    "user_role": "customer",
    "date": "2024-01-15",
    "status": "present",
    "marked_by": "admin_789",
    "marked_by_name": "Admin User",
    "notes": "Marked by admin",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Business Logic:**
- Only admins can use this endpoint
- `marked_by` should be set to the admin's user ID
- `marked_by_name` should be set to the admin's name
- If attendance already exists for the user on that date, update it
- Validate that the user_id exists and is a customer or trainer (not admin)

**Error Responses:**
- `400 Bad Request`: Invalid data or user not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin

---

### 4. Bulk Mark Attendance (Admin)

**Endpoint:** `POST /attendance/bulk`

**Description:** Allows admin to mark attendance for multiple users at once.

**Authentication:** Required (Admin role only)

**Request Body:**
```json
{
  "user_ids": ["user_456", "user_789", "user_101"],
  "date": "2024-01-15",
  "status": "present",
  "notes": "Bulk marked for class"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attendance marked for 3 users",
  "data": [
    {
      "id": "att_123",
      "user_id": "user_456",
      "user_name": "John Doe",
      "user_role": "customer",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": "admin_789",
      "marked_by_name": "Admin User",
      "notes": "Bulk marked for class",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "att_124",
      "user_id": "user_789",
      "user_name": "Jane Smith",
      "user_role": "trainer",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": "admin_789",
      "marked_by_name": "Admin User",
      "notes": "Bulk marked for class",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Business Logic:**
- Only admins can use this endpoint
- Process all user_ids in a single transaction if possible
- If attendance already exists for a user on that date, update it
- Return all created/updated attendance records
- Validate all user_ids exist before processing

**Error Responses:**
- `400 Bad Request`: Invalid data, empty user_ids array, or invalid user_ids
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin

---

### 5. Get All Attendance Records (Admin)

**Endpoint:** `GET /attendance`

**Description:** Retrieves all attendance records with optional filters. Admin only.

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `user_id` (optional): Filter by specific user ID
- `user_role` (optional): Filter by role ('customer' or 'trainer')
- `start_date` (optional): Filter from this date (YYYY-MM-DD)
- `end_date` (optional): Filter until this date (YYYY-MM-DD)
- `status` (optional): Filter by status ('present' or 'absent')

**Examples:**
- `GET /attendance` - Get all records
- `GET /attendance?user_role=customer&status=present`
- `GET /attendance?start_date=2024-01-01&end_date=2024-01-31`
- `GET /attendance?user_id=user_456&start_date=2024-01-01&end_date=2024-01-31`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "att_123",
      "user_id": "user_456",
      "user_name": "John Doe",
      "user_role": "customer",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": "admin_789",
      "marked_by_name": "Admin User",
      "notes": "On time",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Business Logic:**
- Only admins can access this endpoint
- Apply all provided filters (AND logic)
- Include user_name and user_role in response for easier display
- Results should be sorted by date (newest first recommended)
- Support pagination if the dataset is large (optional but recommended)

---

### 6. Get Attendance by User ID (Admin)

**Endpoint:** `GET /attendance/user/:userId`

**Description:** Retrieves all attendance records for a specific user.

**Authentication:** Required (Admin role only)

**Path Parameters:**
- `userId`: The user ID to get attendance for

**Query Parameters:**
- `start_date` (optional): Filter from this date (YYYY-MM-DD)
- `end_date` (optional): Filter until this date (YYYY-MM-DD)

**Example:** `GET /attendance/user/user_456?start_date=2024-01-01&end_date=2024-01-31`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "att_123",
      "user_id": "user_456",
      "user_name": "John Doe",
      "user_role": "customer",
      "date": "2024-01-15",
      "status": "present",
      "marked_by": null,
      "marked_by_name": null,
      "notes": "Self marked",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Business Logic:**
- Only admins can access this endpoint
- Validate that the user exists
- Apply date filters if provided

**Error Responses:**
- `404 Not Found`: User not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin

---

### 7. Update Attendance (Admin)

**Endpoint:** `PATCH /attendance/:id`

**Description:** Updates an existing attendance record.

**Authentication:** Required (Admin role only)

**Path Parameters:**
- `id`: The attendance record ID

**Request Body:**
```json
{
  "status": "absent",
  "notes": "Updated: User was late"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": "att_123",
    "user_id": "user_456",
    "user_name": "John Doe",
    "user_role": "customer",
    "date": "2024-01-15",
    "status": "absent",
    "marked_by": "admin_789",
    "marked_by_name": "Admin User",
    "notes": "Updated: User was late",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Business Logic:**
- Only admins can update attendance
- Update `updated_at` timestamp
- Both status and notes are optional - only update provided fields
- Validate that the attendance record exists

**Error Responses:**
- `404 Not Found`: Attendance record not found
- `400 Bad Request`: Invalid data
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin

---

### 8. Delete Attendance (Admin)

**Endpoint:** `DELETE /attendance/:id`

**Description:** Deletes an attendance record.

**Authentication:** Required (Admin role only)

**Path Parameters:**
- `id`: The attendance record ID

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attendance record deleted successfully"
}
```

**Business Logic:**
- Only admins can delete attendance
- Soft delete is recommended (mark as deleted) but hard delete is acceptable
- Validate that the attendance record exists

**Error Responses:**
- `404 Not Found`: Attendance record not found
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin

---

### 9. Get Attendance Statistics

**Endpoint:** `GET /attendance/stats`

**Description:** Retrieves attendance statistics for a user or all users.

**Authentication:** Required (all roles)

**Query Parameters:**
- `user_id` (optional): Get stats for specific user (admin only if provided)
- `start_date` (optional): Calculate stats from this date (YYYY-MM-DD)
- `end_date` (optional): Calculate stats until this date (YYYY-MM-DD)

**Examples:**
- `GET /attendance/stats` - Get stats for authenticated user (all time)
- `GET /attendance/stats?start_date=2024-01-01&end_date=2024-01-31` - Get stats for date range
- `GET /attendance/stats?user_id=user_456` - Admin: Get stats for specific user

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_days": 30,
    "present_days": 25,
    "absent_days": 5,
    "attendance_percentage": 83.33
  }
}
```

**Business Logic:**
- If `user_id` is provided, only admins can access stats for other users
- If `user_id` is not provided, return stats for the authenticated user
- Calculate based on date range if provided, otherwise all time
- `attendance_percentage` = (present_days / total_days) * 100
- `total_days` = present_days + absent_days
- If no attendance records exist, return zeros

**Error Responses:**
- `400 Bad Request`: Invalid date format
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Non-admin trying to get stats for another user

---

## Response Format Standards

All API responses should follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message or array of error messages",
  "error": "Error type",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/attendance",
  "method": "POST"
}
```

**Note:** The `message` field can be either a string or an array of strings for validation errors.

---

## Business Rules & Validation

### General Rules

1. **Date Format:** All dates must be in `YYYY-MM-DD` format (ISO 8601 date format)

2. **Status Values:** Only 'present' or 'absent' are valid status values

3. **User Roles:** 
   - Only customers and trainers can have attendance records
   - Admins cannot have attendance records (they manage attendance)

4. **Self-Marking:**
   - Customers and trainers can only mark their own attendance
   - `marked_by` should be `null` for self-marked attendance
   - Users can update their own attendance for the current date

5. **Admin Marking:**
   - Admins can mark attendance for any customer or trainer
   - `marked_by` should be set to the admin's user ID
   - `marked_by_name` should be populated for display

6. **Duplicate Prevention:**
   - Only one attendance record per user per date
   - If attendance exists, update it instead of creating duplicate
   - Consider using a unique constraint on (user_id, date)

7. **Date Validation:**
   - Dates should be valid calendar dates
   - Future dates should be allowed (for planning purposes)
   - Past dates should be allowed (for backdating)

8. **Statistics Calculation:**
   - Include all days in the date range, not just days with records
   - If a user has no attendance record for a day, it should count as absent (or be configurable)
   - Percentage should be calculated as: (present_days / total_days) * 100

---

## Database Schema Recommendations

### Attendance Table

```sql
CREATE TABLE attendance (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  marked_by VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (marked_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_user_date (user_id, date)
);
```

**Notes:**
- `marked_by` is nullable (null for self-marked)
- Unique constraint on (user_id, date) prevents duplicates
- Indexes for common query patterns

---

## Authentication & Authorization

### Required Middleware

1. **Authentication Middleware:** Verify JWT token from cookies
2. **Authorization Middleware:** Check user role for admin-only endpoints

### Role-Based Access Control

| Endpoint | Customer | Trainer | Admin |
|----------|----------|--------|-------|
| `POST /attendance/mark` | ✅ | ✅ | ❌ |
| `GET /attendance/own` | ✅ | ✅ | ❌ |
| `POST /attendance` | ❌ | ❌ | ✅ |
| `POST /attendance/bulk` | ❌ | ❌ | ✅ |
| `GET /attendance` | ❌ | ❌ | ✅ |
| `GET /attendance/user/:id` | ❌ | ❌ | ✅ |
| `PATCH /attendance/:id` | ❌ | ❌ | ✅ |
| `DELETE /attendance/:id` | ❌ | ❌ | ✅ |
| `GET /attendance/stats` | ✅* | ✅* | ✅ |

*Customers and trainers can only get their own stats unless admin specifies user_id

---

## Error Codes Reference

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | Success | Attendance marked successfully |
| 400 | Bad Request | Invalid date format, missing required fields |
| 401 | Unauthorized | Not authenticated, invalid token |
| 403 | Forbidden | Insufficient permissions (wrong role) |
| 404 | Not Found | User or attendance record not found |
| 409 | Conflict | Attendance already exists for date |
| 500 | Internal Server Error | Database error, server error |

---

## Testing Recommendations

### Test Cases to Cover

1. **Customer/Trainer Self-Marking:**
   - Mark present for today
   - Mark absent for today
   - Update existing attendance
   - Mark for past date
   - Mark for future date

2. **Admin Operations:**
   - Mark attendance for customer
   - Mark attendance for trainer
   - Bulk mark for multiple users
   - Filter by role, date range, status
   - Update attendance record
   - Delete attendance record

3. **Edge Cases:**
   - Duplicate attendance for same user/date
   - Invalid date formats
   - Non-existent user_id
   - Unauthorized access attempts
   - Statistics with no records
   - Statistics with date range

4. **Validation:**
   - Required fields missing
   - Invalid status values
   - Invalid date formats
   - Invalid user_id

---

## Additional Notes

1. **Performance Considerations:**
   - Consider pagination for large datasets
   - Use database indexes for common queries
   - Cache statistics if they're expensive to calculate

2. **Data Consistency:**
   - Use transactions for bulk operations
   - Ensure atomic updates
   - Handle concurrent requests properly

3. **Audit Trail:**
   - Consider logging who marked attendance and when
   - Track changes to attendance records
   - Maintain history of updates

4. **Future Enhancements (Optional):**
   - Export attendance data (CSV/Excel)
   - Email notifications for attendance
   - Attendance reports by month/week
   - Integration with class schedules

---

## Contact & Support

For questions or clarifications about this API specification, please contact the frontend development team.

**Last Updated:** January 2024

