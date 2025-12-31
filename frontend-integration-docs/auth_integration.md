# Authentication Integration Guide

Complete guide for integrating authentication endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/auth
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh` | Refresh access token | No (uses refresh token cookie) |
| POST | `/logout` | Logout user | Yes |
| GET | `/profile` | Get authenticated user profile | Yes |
| POST | `/admin/create` | Create admin user | Yes (Admin only) |

---

## 1. Register User

Register a new user account.

### Endpoint
```
POST /api/v1/auth/register
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",  // Optional
  "phone": "1234567890",
  "pin": "123456",  // 6-8 digits
  "role": "customer"  // Optional: "customer" | "admin" | "trainer" (default: "customer")
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | Non-empty | User's full name |
| email | string | No | Valid email format | User's email address |
| phone | string | Yes | Non-empty | User's phone number |
| pin | string | Yes | 6-8 digits | User's PIN for authentication |
| role | string | No | "customer" \| "admin" \| "trainer" | User role (default: "customer") |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 409 Conflict - Phone or Email Already Exists
```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "message": "Phone number or email already exists",
  "path": "/api/v1/auth/register",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "PIN must be 6-8 digits",
    "name should not be empty"
  ],
  "path": "/api/v1/auth/register",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Too many requests. Please try again later.",
  "path": "/api/v1/auth/register",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        pin: userData.pin,
        role: userData.role || 'customer'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Usage
registerUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  pin: '123456'
});
```

---

## 2. Login User

Authenticate user and receive access/refresh tokens (stored in cookies).

### Endpoint
```
POST /api/v1/auth/login
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "phone": "1234567890",
  "pin": "123456"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| phone | string | Yes | Non-empty | User's phone number |
| pin | string | Yes | 6-8 digits | User's PIN |

### Success Response (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer"
  }
}
```

**Note:** Access and refresh tokens are automatically set as httpOnly cookies:
- `access_token` - Expires in 15 minutes
- `refresh_token` - Expires in 7 days

### Error Responses

#### 401 Unauthorized - Invalid Credentials
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid phone or PIN",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Too many requests. Please try again later.",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const loginUser = async (phone, pin) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include', // Required for cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        pin: pin
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Cookies are automatically stored by browser
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Usage
loginUser('1234567890', '123456');
```

---

## 3. Refresh Token

Refresh the access token using the refresh token cookie.

### Endpoint
```
POST /api/v1/auth/refresh
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication header needed. Uses `refresh_token` cookie automatically.

### Request Body
None required (uses refresh token from cookie)

### Success Response (200 OK)
```json
{
  "message": "Tokens refreshed successfully"
}
```

**Note:** New access and refresh tokens are automatically set as httpOnly cookies.

### Error Responses

#### 400 Bad Request - No Refresh Token
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "No refresh token found",
  "path": "/api/v1/auth/refresh",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 401 Unauthorized - Invalid Refresh Token
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid refresh token",
  "path": "/api/v1/auth/refresh",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const refreshToken = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Required for cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

// Usage - Call this when access token expires
refreshToken();
```

---

## 4. Logout User

Logout user and invalidate tokens.

### Endpoint
```
POST /api/v1/auth/logout
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent).

### Request Body
None required

### Success Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Cookies are automatically cleared by the server.

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/auth/logout",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const logoutUser = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include', // Required for cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }

    return data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Usage
logoutUser();
```

---

## 5. Get User Profile

Get the authenticated user's profile information.

### Endpoint
```
GET /api/v1/auth/profile
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent).

### Request Body
None required

### Success Response (200 OK)
```json
{
  "user": {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "1234567890",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "customer"
  },
  "message": "Profile retrieved successfully"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| user.sub | string | User ID (UUID) |
| user.phone | string | User's phone number |
| user.email | string | User's email |
| user.name | string | User's full name |
| user.role | string | User role: "customer" \| "admin" \| "trainer" |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/auth/profile",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getUserProfile = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
      method: 'GET',
      credentials: 'include', // Required for cookies
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }

    return data.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Usage
getUserProfile().then(user => {
  console.log('Current user:', user);
});
```

---

## 6. Create Admin User (Admin Only)

Create a new admin user. Only accessible by existing admin users.

### Endpoint
```
POST /api/v1/auth/admin/create
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires admin authentication (cookies are automatically sent).

### Request Body
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "9876543210",
  "pin": "123456",
  "role": "admin"  // Will be forced to "admin" regardless of input
}
```

### Request Body Schema
Same as register endpoint. The `role` field will be automatically set to "admin".

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "9876543210",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/auth/admin/create",
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
  "path": "/api/v1/auth/admin/create",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createAdmin = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/admin/create', {
      method: 'POST',
      credentials: 'include', // Required for cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        pin: userData.pin
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create admin');
    }

    return data;
  } catch (error) {
    console.error('Create admin error:', error);
    throw error;
  }
};

// Usage (must be logged in as admin)
createAdmin({
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '9876543210',
  pin: '123456'
});
```

---

## 🔄 Token Refresh Strategy

Implement automatic token refresh when access token expires:

```javascript
// Interceptor for automatic token refresh
const apiCall = async (url, options = {}) => {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      await refreshToken();
      // Retry original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });
    } catch (error) {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
};
```

---

## 📝 Complete Authentication Flow Example

```javascript
class AuthService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  async login(phone, pin) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    return this.handleResponse(response);
  }

  async logout() {
    const response = await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
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
const auth = new AuthService('http://localhost:3000/api/v1');

// Register
await auth.register({
  name: 'John Doe',
  phone: '1234567890',
  pin: '123456'
});

// Login
await auth.login('1234567890', '123456');

// Get profile
const profile = await auth.getProfile();

// Logout
await auth.logout();
```

