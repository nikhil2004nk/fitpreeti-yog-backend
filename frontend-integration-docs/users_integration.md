# Users Integration Guide

Complete guide for integrating user management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/users
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/` | Get all users | Yes | Admin |
| GET | `/:phone` | Get user by phone | Yes | Admin |
| PATCH | `/:phone/role` | Update user role | Yes | Admin |

**Note:** All endpoints in this module require Admin authentication.

---

## 1. Get All Users

Get a list of all users in the system. Admin only.

### Endpoint
```
GET /api/v1/users
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin role required.

### Request Body
None required

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "customer",
      "profile_image": null,
      "is_active": true,
      "last_login": "2024-01-15T10:30:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "9876543210",
      "role": "trainer",
      "profile_image": "https://example.com/profile.jpg",
      "is_active": true,
      "last_login": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the request was successful |
| message | string | Response message |
| data | array | Array of user objects |
| timestamp | string | Response timestamp (ISO) |

### User Object Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | User UUID |
| name | string | User's full name |
| email | string | User's email address |
| phone | string | User's phone number |
| role | string | User role: "customer" \| "admin" \| "trainer" |
| profile_image | string \| null | URL to user's profile image |
| is_active | boolean | Whether the user account is active |
| last_login | string \| null | Last login timestamp (ISO) |
| created_at | string | Creation timestamp (ISO) |
| updated_at | string | Last update timestamp (ISO) |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/users",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/users",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getAllUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch users');
    }

    // Response is wrapped in standard format: { success, message, data, timestamp }
    return data.data; // Return the users array
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// Usage (Admin only)
getAllUsers().then(users => {
  // users is an array of user objects
  console.log('All users:', users);
});
```

---

## 2. Get User by Phone

Get a specific user by their phone number. Admin only.

### Endpoint
```
GET /api/v1/users/:phone
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin role required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | User's phone number |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "profile_image": null,
    "is_active": true,
    "last_login": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the request was successful |
| message | string | Response message |
| data | object | User object |
| timestamp | string | Response timestamp (ISO) |

### User Object Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | User UUID |
| name | string | User's full name |
| email | string | User's email address |
| phone | string | User's phone number |
| role | string | User role: "customer" \| "admin" \| "trainer" |
| profile_image | string \| null | URL to user's profile image |
| is_active | boolean | Whether the user account is active |
| last_login | string \| null | Last login timestamp (ISO) |
| created_at | string | Creation timestamp (ISO) |
| updated_at | string | Last update timestamp (ISO) |

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "User not found",
  "path": "/api/v1/users/1234567890",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/users/1234567890",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getUserByPhone = async (phone) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/users/${phone}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user');
    }

    // Response is wrapped in standard format: { success, message, data, timestamp }
    return data.data; // Return the user object
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// Usage (Admin only)
getUserByPhone('1234567890').then(user => {
  // user is a user object with all fields
  console.log('User:', user);
});
```

---

## 3. Update User Role

Update a user's role. Admin only.

### Endpoint
```
PATCH /api/v1/users/:phone/role
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin role required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | User's phone number |

### Request Body
```json
{
  "role": "trainer"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| role | string | Yes | "customer" \| "admin" \| "trainer" | New user role |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "trainer",
    "profile_image": null,
    "is_active": true,
    "last_login": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T01:00:00.000Z"
  },
  "timestamp": "2024-01-01T01:00:00.000Z"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the request was successful |
| message | string | Response message |
| data | object | Updated user object |
| timestamp | string | Response timestamp (ISO) |

### User Object Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | User UUID |
| name | string | User's full name |
| email | string | User's email address |
| phone | string | User's phone number |
| role | string | User role: "customer" \| "admin" \| "trainer" |
| profile_image | string \| null | URL to user's profile image |
| is_active | boolean | Whether the user account is active |
| last_login | string \| null | Last login timestamp (ISO) |
| created_at | string | Creation timestamp (ISO) |
| updated_at | string | Last update timestamp (ISO) |

### Error Responses

#### 400 Bad Request - Invalid Role
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid role. Must be one of: customer, admin, trainer",
  "path": "/api/v1/users/1234567890/role",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "User not found",
  "path": "/api/v1/users/1234567890/role",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/users/1234567890/role",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateUserRole = async (phone, role) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/users/${phone}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user role');
    }

    // Response is wrapped in standard format: { success, message, data, timestamp }
    return data.data; // Return the updated user object
  } catch (error) {
    console.error('Update user role error:', error);
    throw error;
  }
};

// Usage (Admin only)
updateUserRole('1234567890', 'trainer').then(user => {
  // user is the updated user object with all fields
  console.log('Updated user:', user);
});
```

---

## 📝 Complete User Service Example

```javascript
class UserService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getAll() {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getByPhone(phone) {
    const response = await fetch(`${this.baseURL}/users/${phone}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async updateRole(phone, role) {
    const response = await fetch(`${this.baseURL}/users/${phone}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    // Response is wrapped in standard format: { success, message, data, timestamp }
    return data.data; // Return the actual data
  }
}

// Usage (Admin only)
const userService = new UserService('http://localhost:3000/api/v1');

// Get all users
const users = await userService.getAll();

// Get user by phone
const user = await userService.getByPhone('1234567890');

// Update user role
await userService.updateRole('1234567890', 'trainer');
```

---

## 🔐 Security Notes

1. **All endpoints require Admin authentication** - Only users with the "admin" role can access these endpoints
2. **Phone numbers are used as identifiers** - Phone numbers are unique identifiers for users
3. **Role validation** - Only valid roles ("customer", "admin", "trainer") can be assigned
4. **Cannot change your own role** - Admins should not be able to change their own role (implement this check on frontend if needed)

---

## 📋 Role Management Best Practices

1. **Verify admin status** - Always check if the current user is an admin before showing user management UI
2. **Confirm role changes** - Show confirmation dialogs before changing user roles
3. **Audit trail** - Consider logging role changes for security purposes
4. **Prevent self-demotion** - Prevent admins from changing their own role to non-admin

### Example: Role Change Confirmation
```javascript
const changeUserRole = async (phone, newRole) => {
  const confirmed = window.confirm(
    `Are you sure you want to change this user's role to ${newRole}?`
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    const updatedUser = await updateUserRole(phone, newRole);
    console.log('Role updated successfully:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Failed to update role:', error);
    alert('Failed to update user role. Please try again.');
    throw error;
  }
};
```

