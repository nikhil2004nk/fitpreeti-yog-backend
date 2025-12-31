# Bookings Integration Guide

Complete guide for integrating booking management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/bookings
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/` | Create a new booking | Yes | Any |
| GET | `/` | Get user's bookings | Yes | Any |
| GET | `/:id` | Get booking by ID | Yes | Any |
| GET | `/available/:serviceId/:date` | Get available time slots | Yes | Any |
| GET | `/admin/all` | Get all bookings | Yes | Admin/Trainer |
| PATCH | `/:id` | Update booking | Yes | Admin/Trainer |
| DELETE | `/:id` | Cancel/delete booking | Yes | Any (own bookings) |

---

## 1. Create Booking

Create a new booking for a service.

### Endpoint
```
POST /api/v1/bookings
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). User is automatically associated with the booking.

### Request Body
```json
{
  "service_id": "123e4567-e89b-12d3-a456-426614174000",
  "booking_date": "2024-01-15",
  "booking_time": "10:00",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "special_requests": "Please provide yoga mat"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| service_id | string (UUID) | Yes | Valid UUID | Service UUID to book |
| booking_date | string | Yes | ISO date format (YYYY-MM-DD) | Date of the booking |
| booking_time | string | Yes | Time format (HH:mm) | Time of the booking |
| full_name | string | Yes | Min 2 characters | Full name of the person booking |
| email | string | Yes | Valid email format | Email address |
| phone | string | Yes | Min 10 characters | Phone number |
| special_requests | string | No | - | Special requests or notes |

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_phone": "1234567890",
  "service_id": "123e4567-e89b-12d3-a456-426614174000",
  "booking_date": "2024-01-15",
  "booking_time": "10:00",
  "special_requests": "Please provide yoga mat",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Time Slot Already Booked
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Time slot already booked",
  "path": "/api/v1/bookings",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 404 Not Found - Service Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Service not found",
  "path": "/api/v1/bookings",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/bookings",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createBooking = async (bookingData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/bookings', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }

    return data;
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
};

// Usage
createBooking({
  service_id: '123e4567-e89b-12d3-a456-426614174000',
  booking_date: '2024-01-15',
  booking_time: '10:00',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  special_requests: 'Please provide yoga mat'
});
```

---

## 2. Get User Bookings

Get all bookings for the authenticated user.

### Endpoint
```
GET /api/v1/bookings
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Returns only bookings for the logged-in user.

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_phone": "1234567890",
    "service_id": "123e4567-e89b-12d3-a456-426614174000",
    "booking_date": "2024-01-15",
    "booking_time": "10:00",
    "special_requests": "Please provide yoga mat",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "status": "confirmed",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Booking UUID |
| user_id | string | User UUID |
| user_phone | string | User's phone number |
| service_id | string | Service UUID |
| booking_date | string | Booking date (YYYY-MM-DD) |
| booking_time | string | Booking time (HH:mm) |
| special_requests | string \| null | Special requests |
| full_name | string | Full name |
| email | string | Email address |
| phone | string | Phone number |
| status | string | Booking status: "pending" \| "confirmed" \| "cancelled" \| "completed" |
| created_at | string | Creation timestamp (ISO) |

### Example Request (JavaScript)
```javascript
const getUserBookings = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/bookings', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bookings');
    }

    return data;
  } catch (error) {
    console.error('Get bookings error:', error);
    throw error;
  }
};

// Usage
getUserBookings().then(bookings => {
  console.log('My bookings:', bookings);
});
```

---

## 3. Get Booking by ID

Get a specific booking by its ID. Users can only access their own bookings.

### Endpoint
```
GET /api/v1/bookings/:id
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
| id | string (UUID) | Yes | Booking UUID |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_phone": "1234567890",
  "service_id": "123e4567-e89b-12d3-a456-426614174000",
  "booking_date": "2024-01-15",
  "booking_time": "10:00",
  "special_requests": "Please provide yoga mat",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "status": "confirmed",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Booking not found",
  "path": "/api/v1/bookings/123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getBookingById = async (bookingId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/bookings/${bookingId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch booking');
    }

    return data;
  } catch (error) {
    console.error('Get booking error:', error);
    throw error;
  }
};

// Usage
getBookingById('123e4567-e89b-12d3-a456-426614174000').then(booking => {
  console.log('Booking:', booking);
});
```

---

## 4. Get Available Time Slots

Get available time slots for a service on a specific date.

### Endpoint
```
GET /api/v1/bookings/available/:serviceId/:date
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
| serviceId | string (UUID) | Yes | Service UUID |
| date | string | Yes | Date in YYYY-MM-DD format |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "date": "2024-01-15",
  "service_id": "123e4567-e89b-12d3-a456-426614174000",
  "available_slots": [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00"
  ],
  "booked_slots": [
    "13:00"
  ]
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| date | string | Requested date |
| service_id | string | Service UUID |
| available_slots | string[] | Array of available time slots (HH:mm format) |
| booked_slots | string[] | Array of booked time slots (HH:mm format) |

### Error Responses

#### 404 Not Found - Service Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Service not found",
  "path": "/api/v1/bookings/available/123e4567-e89b-12d3-a456-426614174000/2024-01-15",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getAvailableSlots = async (serviceId, date) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/bookings/available/${serviceId}/${date}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch available slots');
    }

    return data;
  } catch (error) {
    console.error('Get available slots error:', error);
    throw error;
  }
};

// Usage
getAvailableSlots('123e4567-e89b-12d3-a456-426614174000', '2024-01-15').then(slots => {
  console.log('Available slots:', slots.available_slots);
});
```

---

## 5. Get All Bookings (Admin/Trainer)

Get all bookings in the system. Admin and Trainer only.

### Endpoint
```
GET /api/v1/bookings/admin/all
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin or Trainer role required.

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_phone": "1234567890",
    "service_id": "123e4567-e89b-12d3-a456-426614174000",
    "booking_date": "2024-01-15",
    "booking_time": "10:00",
    "special_requests": "Please provide yoga mat",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "status": "confirmed",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Error Responses

#### 403 Forbidden - Not Admin/Trainer
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/bookings/admin/all",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getAllBookings = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/bookings/admin/all', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bookings');
    }

    return data;
  } catch (error) {
    console.error('Get all bookings error:', error);
    throw error;
  }
};

// Usage (Admin/Trainer only)
getAllBookings().then(bookings => {
  console.log('All bookings:', bookings);
});
```

---

## 6. Update Booking

Update a booking. Admin or Trainer only.

### Endpoint
```
PATCH /api/v1/bookings/:id
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
| id | string (UUID) | Yes | Booking UUID |

### Request Body
All fields are optional (partial update):
```json
{
  "booking_date": "2024-01-16",
  "booking_time": "11:00",
  "status": "confirmed",
  "special_requests": "Updated request"
}
```

### Request Body Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| service_id | string (UUID) | No | Service UUID |
| booking_date | string | No | Date in YYYY-MM-DD format |
| booking_time | string | No | Time in HH:mm format |
| full_name | string | No | Full name |
| email | string | No | Email address |
| phone | string | No | Phone number |
| special_requests | string | No | Special requests |
| status | string | No | Status: "pending" \| "confirmed" \| "cancelled" \| "completed" |

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_phone": "1234567890",
  "service_id": "123e4567-e89b-12d3-a456-426614174000",
  "booking_date": "2024-01-16",
  "booking_time": "11:00",
  "special_requests": "Updated request",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "status": "confirmed",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Booking not found",
  "path": "/api/v1/bookings/123e4567-e89b-12d3-a456-426614174000",
  "method": "PATCH",
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
  "path": "/api/v1/bookings/123e4567-e89b-12d3-a456-426614174000",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateBooking = async (bookingId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/bookings/${bookingId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking');
    }

    return data;
  } catch (error) {
    console.error('Update booking error:', error);
    throw error;
  }
};

// Usage (Admin/Trainer only)
updateBooking('123e4567-e89b-12d3-a456-426614174000', {
  status: 'confirmed',
  booking_time: '11:00'
});
```

---

## 7. Delete/Cancel Booking

Cancel or delete a booking. Users can cancel their own bookings.

### Endpoint
```
DELETE /api/v1/bookings/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Users can only delete their own bookings.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Booking UUID |

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
  "message": "Booking not found",
  "path": "/api/v1/bookings/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const cancelBooking = async (bookingId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to cancel booking');
    }

    return true; // Success
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
};

// Usage
cancelBooking('123e4567-e89b-12d3-a456-426614174000');
```

---

## 📝 Complete Booking Service Example

```javascript
class BookingService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async create(bookingData) {
    const response = await fetch(`${this.baseURL}/bookings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return this.handleResponse(response);
  }

  async getUserBookings() {
    const response = await fetch(`${this.baseURL}/bookings`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/bookings/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getAvailableSlots(serviceId, date) {
    const response = await fetch(`${this.baseURL}/bookings/available/${serviceId}/${date}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getAll() {
    const response = await fetch(`${this.baseURL}/bookings/admin/all`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async update(id, updateData) {
    const response = await fetch(`${this.baseURL}/bookings/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async cancel(id) {
    const response = await fetch(`${this.baseURL}/bookings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to cancel booking');
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
const bookingService = new BookingService('http://localhost:3000/api/v1');

// Create booking
await bookingService.create({
  service_id: '123e4567-e89b-12d3-a456-426614174000',
  booking_date: '2024-01-15',
  booking_time: '10:00',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890'
});

// Get user bookings
const bookings = await bookingService.getUserBookings();

// Get available slots
const slots = await bookingService.getAvailableSlots('123e4567-e89b-12d3-a456-426614174000', '2024-01-15');

// Cancel booking
await bookingService.cancel('123e4567-e89b-12d3-a456-426614174000');
```

