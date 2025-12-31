# Frontend Integration Documentation

This folder contains comprehensive API integration documentation for the Fitpreeti Yoga Backend API.

## 📋 Table of Contents

1. [Authentication Integration](./auth_integration.md) - User registration, login, logout, token management
2. [Trainers Integration](./trainers_integration.md) - Trainer CRUD operations (with automatic rating calculation)
3. [Services Integration](./services_integration.md) - Service management and queries
4. [Bookings Integration](./bookings_integration.md) - Booking creation, management, and availability
5. [Reviews Integration](./reviews_integration.md) - Review creation and management (auto-updates trainer ratings)
6. [Class Schedule Integration](./class_schedule_integration.md) - Class scheduling and management
7. [Users Integration](./users_integration.md) - User management (Admin only)

## 🔄 Automatic Features

### Trainer Rating System
- Trainer ratings are **automatically calculated** from approved reviews
- When a review is approved, the trainer's `rating` (average) and `total_reviews` count are updated
- Ratings are linked through: `reviews → bookings → services → trainers`
- Only approved reviews count towards ratings

## 🔧 Base Configuration

### Base URL
```
Development: http://localhost:3000
Production: [Your Production URL]
```

### API Prefix
All endpoints are prefixed with `/api/v1`

### Complete Base URL
```
http://localhost:3000/api/v1
```

## 🔐 Authentication

The API uses **Cookie-based JWT authentication**. All authenticated endpoints require:
- Cookies to be sent with requests (`credentials: 'include'` in fetch)
- CORS must be configured to allow credentials

### Important Notes:
- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days**
- Tokens are stored in **httpOnly cookies** (secure, not accessible via JavaScript)
- Cookies are automatically sent with requests if `credentials: 'include'` is set

## 📡 Making Requests

### Fetch API Example
```javascript
// GET request with authentication
fetch('http://localhost:3000/api/v1/auth/profile', {
  method: 'GET',
  credentials: 'include', // Required for cookies
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// POST request with body
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '1234567890',
    pin: '123456'
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Axios Example
```javascript
import axios from 'axios';

// Configure axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // Required for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Example request
api.get('/auth/profile')
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));
```

## 🎭 User Roles

The API supports three user roles:

1. **customer** - Default role, can book services and create reviews
2. **trainer** - Can manage class schedules and view bookings
3. **admin** - Full access to all endpoints

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed" | ["Error 1", "Error 2"],
  "path": "/api/v1/endpoint",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚦 HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## ⚡ Rate Limiting

- **General endpoints**: 100 requests per minute
- **Auth endpoints**: 5 requests per 15 minutes

## 🔍 Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api
```

## 📝 Common Headers

All requests should include:
```
Content-Type: application/json
```

Authenticated requests automatically include cookies (no manual header needed).

## 🛠️ Error Handling

Always check the response status and handle errors appropriately:

```javascript
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}
```

## 📚 Next Steps

1. Start with [Authentication Integration](./auth_integration.md) to set up login/registration
2. Review the specific module documentation for your use case
3. Test endpoints using the provided examples
4. Implement error handling and token refresh logic

