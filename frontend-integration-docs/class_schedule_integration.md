# Class Schedule Integration Guide

Complete guide for integrating class schedule management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/class-schedule
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/` | Create a new class schedule | Yes | Admin/Trainer |
| GET | `/` | Get all class schedules | Yes | Any |
| GET | `/:id` | Get class schedule by ID | Yes | Any |
| GET | `/trainer/:trainerId/availability` | Check trainer availability | Yes | Any |
| PUT | `/:id` | Update class schedule | Yes | Admin/Trainer |
| DELETE | `/:id` | Delete class schedule | Yes | Admin/Trainer |

---

## 1. Create Class Schedule

Create a new class schedule. Admin or Trainer only.

### Endpoint
```
POST /api/v1/class-schedule
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin or Trainer role required.

### Request Body
```json
{
  "title": "Morning Hatha Yoga",
  "description": "Gentle morning yoga session for all levels",
  "start_time": "2024-01-15T09:00:00.000Z",
  "end_time": "2024-01-15T10:00:00.000Z",
  "status": "scheduled",
  "max_participants": 20,
  "current_participants": 0,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "service_id": "123e4567-e89b-12d3-a456-426614174001",
  "is_recurring": false,
  "recurrence_pattern": "weekly",
  "recurrence_end_date": "2024-12-31T00:00:00.000Z"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | Non-empty | Class title |
| description | string | No | - | Class description |
| start_time | string | Yes | ISO date string | Class start time |
| end_time | string | Yes | ISO date string | Class end time |
| status | string | No | Enum: "scheduled" \| "cancelled" \| "completed" \| "in_progress" | Class status (default: "scheduled") |
| max_participants | number | No | Min 1 | Maximum participants (default: 20) |
| current_participants | number | No | Min 0 | Current participants (default: 0) |
| trainer_id | string (UUID) | Yes | Valid UUID | Trainer UUID |
| service_id | string (UUID) | Yes | Valid UUID | Service UUID |
| is_recurring | boolean | No | - | Whether class is recurring (default: false) |
| recurrence_pattern | string | No | "daily" \| "weekly" \| "monthly" | Recurrence pattern |
| recurrence_end_date | string | No | ISO date string | End date for recurring classes |

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Morning Hatha Yoga",
  "description": "Gentle morning yoga session for all levels",
  "start_time": "2024-01-15T09:00:00.000Z",
  "end_time": "2024-01-15T10:00:00.000Z",
  "status": "scheduled",
  "max_participants": 20,
  "current_participants": 0,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "service_id": "123e4567-e89b-12d3-a456-426614174001",
  "is_recurring": false,
  "recurrence_pattern": "weekly",
  "recurrence_end_date": "2024-12-31T00:00:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Class schedule UUID |
| title | string | Class title |
| description | string \| null | Class description |
| start_time | string | Start time (ISO) |
| end_time | string | End time (ISO) |
| status | string | Status: "scheduled" \| "cancelled" \| "completed" \| "in_progress" |
| max_participants | number | Maximum participants |
| current_participants | number | Current participants |
| trainer_id | string | Trainer UUID |
| service_id | string | Service UUID |
| is_recurring | boolean | Whether class is recurring |
| recurrence_pattern | string \| null | Recurrence pattern |
| recurrence_end_date | string \| null | Recurrence end date (ISO) |
| created_at | string | Creation timestamp (ISO) |
| updated_at | string | Last update timestamp (ISO) |

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "title should not be empty",
    "start_time must be a valid ISO 8601 date string"
  ],
  "path": "/api/v1/class-schedule",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 404 Not Found - Trainer/Service Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Trainer not found",
  "path": "/api/v1/class-schedule",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin/Trainer
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/class-schedule",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createClassSchedule = async (scheduleData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/class-schedule', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create class schedule');
    }

    return data;
  } catch (error) {
    console.error('Create class schedule error:', error);
    throw error;
  }
};

// Usage
createClassSchedule({
  title: 'Morning Hatha Yoga',
  description: 'Gentle morning yoga session',
  start_time: '2024-01-15T09:00:00.000Z',
  end_time: '2024-01-15T10:00:00.000Z',
  trainer_id: '123e4567-e89b-12d3-a456-426614174000',
  service_id: '123e4567-e89b-12d3-a456-426614174001',
  max_participants: 20
});
```

---

## 2. Get All Class Schedules

Get all class schedules with optional filters.

### Endpoint
```
GET /api/v1/class-schedule
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent).

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_time | string | No | Filter by start time (ISO date string) |
| end_time | string | No | Filter by end time (ISO date string) |
| trainer_id | string (UUID) | No | Filter by trainer UUID |
| service_id | string (UUID) | No | Filter by service UUID |

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Morning Hatha Yoga",
    "description": "Gentle morning yoga session for all levels",
    "start_time": "2024-01-15T09:00:00.000Z",
    "end_time": "2024-01-15T10:00:00.000Z",
    "status": "scheduled",
    "max_participants": 20,
    "current_participants": 5,
    "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
    "service_id": "123e4567-e89b-12d3-a456-426614174001",
    "is_recurring": false,
    "recurrence_pattern": null,
    "recurrence_end_date": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getAllClassSchedules = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.start_time) queryParams.append('start_time', filters.start_time);
    if (filters.end_time) queryParams.append('end_time', filters.end_time);
    if (filters.trainer_id) queryParams.append('trainer_id', filters.trainer_id);
    if (filters.service_id) queryParams.append('service_id', filters.service_id);

    const url = `http://localhost:3000/api/v1/class-schedule${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch class schedules');
    }

    return data;
  } catch (error) {
    console.error('Get class schedules error:', error);
    throw error;
  }
};

// Usage
getAllClassSchedules().then(schedules => {
  console.log('All schedules:', schedules);
});

// With filters
getAllClassSchedules({
  trainer_id: '123e4567-e89b-12d3-a456-426614174000',
  start_time: '2024-01-15T00:00:00.000Z'
}).then(schedules => {
  console.log('Filtered schedules:', schedules);
});
```

---

## 3. Get Class Schedule by ID

Get a specific class schedule by its ID.

### Endpoint
```
GET /api/v1/class-schedule/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent).

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Class schedule UUID |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Morning Hatha Yoga",
  "description": "Gentle morning yoga session for all levels",
  "start_time": "2024-01-15T09:00:00.000Z",
  "end_time": "2024-01-15T10:00:00.000Z",
  "status": "scheduled",
  "max_participants": 20,
  "current_participants": 5,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "service_id": "123e4567-e89b-12d3-a456-426614174001",
  "is_recurring": false,
  "recurrence_pattern": null,
  "recurrence_end_date": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Class schedule not found",
  "path": "/api/v1/class-schedule/123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getClassScheduleById = async (scheduleId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/class-schedule/${scheduleId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch class schedule');
    }

    return data;
  } catch (error) {
    console.error('Get class schedule error:', error);
    throw error;
  }
};

// Usage
getClassScheduleById('123e4567-e89b-12d3-a456-426614174000').then(schedule => {
  console.log('Class schedule:', schedule);
});
```

---

## 4. Check Trainer Availability

Check if a trainer is available for a specific date and duration.

### Endpoint
```
GET /api/v1/class-schedule/trainer/:trainerId/availability
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent).

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trainerId | string (UUID) | Yes | Trainer UUID |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in ISO format |
| duration | number | Yes | Duration in minutes |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "available": true,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "requested_date": "2024-01-15T00:00:00.000Z",
  "requested_duration": 60,
  "conflicts": []
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| available | boolean | Whether trainer is available |
| trainer_id | string | Trainer UUID |
| requested_date | string | Requested date (ISO) |
| requested_duration | number | Requested duration in minutes |
| conflicts | array | Array of conflicting class schedules |

### Error Responses

#### 400 Bad Request - Invalid Date/Duration
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid date or duration",
  "path": "/api/v1/class-schedule/trainer/123e4567-e89b-12d3-a456-426614174000/availability",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const checkTrainerAvailability = async (trainerId, date, duration) => {
  try {
    const url = `http://localhost:3000/api/v1/class-schedule/trainer/${trainerId}/availability?date=${date}&duration=${duration}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check availability');
    }

    return data;
  } catch (error) {
    console.error('Check availability error:', error);
    throw error;
  }
};

// Usage
checkTrainerAvailability(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-01-15T09:00:00.000Z',
  60
).then(result => {
  console.log('Available:', result.available);
});
```

---

## 5. Update Class Schedule

Update an existing class schedule. Admin or Trainer only.

### Endpoint
```
PUT /api/v1/class-schedule/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin or Trainer role required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Class schedule UUID |

### Request Body
All fields are optional (partial update):
```json
{
  "title": "Updated Class Title",
  "status": "cancelled",
  "current_participants": 10,
  "max_participants": 25
}
```

### Request Body Schema
Same as Create Class Schedule, but all fields are optional.

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Class Title",
  "description": "Gentle morning yoga session for all levels",
  "start_time": "2024-01-15T09:00:00.000Z",
  "end_time": "2024-01-15T10:00:00.000Z",
  "status": "cancelled",
  "max_participants": 25,
  "current_participants": 10,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "service_id": "123e4567-e89b-12d3-a456-426614174001",
  "is_recurring": false,
  "recurrence_pattern": null,
  "recurrence_end_date": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T01:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Class schedule not found",
  "path": "/api/v1/class-schedule/123e4567-e89b-12d3-a456-426614174000",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin/Trainer
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/class-schedule/123e4567-e89b-12d3-a456-426614174000",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateClassSchedule = async (scheduleId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/class-schedule/${scheduleId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update class schedule');
    }

    return data;
  } catch (error) {
    console.error('Update class schedule error:', error);
    throw error;
  }
};

// Usage (Admin/Trainer only)
updateClassSchedule('123e4567-e89b-12d3-a456-426614174000', {
  status: 'cancelled',
  current_participants: 10
});
```

---

## 6. Delete Class Schedule

Delete a class schedule. Admin or Trainer only.

### Endpoint
```
DELETE /api/v1/class-schedule/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin or Trainer role required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Class schedule UUID |

### Request Body
None required

### Success Response (204 No Content)
No response body. Status code 204 indicates successful deletion.

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Class schedule not found",
  "path": "/api/v1/class-schedule/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin/Trainer
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/class-schedule/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const deleteClassSchedule = async (scheduleId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/class-schedule/${scheduleId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete class schedule');
    }

    return true; // Success
  } catch (error) {
    console.error('Delete class schedule error:', error);
    throw error;
  }
};

// Usage (Admin/Trainer only)
deleteClassSchedule('123e4567-e89b-12d3-a456-426614174000');
```

---

## 📝 Complete Class Schedule Service Example

```javascript
class ClassScheduleService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async create(scheduleData) {
    const response = await fetch(`${this.baseURL}/class-schedule`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    return this.handleResponse(response);
  }

  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.start_time) queryParams.append('start_time', filters.start_time);
    if (filters.end_time) queryParams.append('end_time', filters.end_time);
    if (filters.trainer_id) queryParams.append('trainer_id', filters.trainer_id);
    if (filters.service_id) queryParams.append('service_id', filters.service_id);

    const url = `${this.baseURL}/class-schedule${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/class-schedule/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async checkTrainerAvailability(trainerId, date, duration) {
    const url = `${this.baseURL}/class-schedule/trainer/${trainerId}/availability?date=${date}&duration=${duration}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async update(id, updateData) {
    const response = await fetch(`${this.baseURL}/class-schedule/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async delete(id) {
    const response = await fetch(`${this.baseURL}/class-schedule/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete class schedule');
    }
    return true;
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }
}

// Usage
const classScheduleService = new ClassScheduleService('http://localhost:3000/api/v1');

// Create class schedule (Admin/Trainer only)
await classScheduleService.create({
  title: 'Morning Hatha Yoga',
  start_time: '2024-01-15T09:00:00.000Z',
  end_time: '2024-01-15T10:00:00.000Z',
  trainer_id: '123e4567-e89b-12d3-a456-426614174000',
  service_id: '123e4567-e89b-12d3-a456-426614174001'
});

// Get all schedules
const schedules = await classScheduleService.getAll();

// Check trainer availability
const availability = await classScheduleService.checkTrainerAvailability(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-01-15T09:00:00.000Z',
  60
);
```

