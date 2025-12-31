# Services Integration Guide

Complete guide for integrating service management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/services
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/` | Create a new service | Yes | Admin |
| GET | `/` | Get all services | No | - |
| GET | `/popular` | Get popular services | No | - |
| GET | `/:id` | Get service by ID | No | - |
| GET | `/type/:type` | Get services by type | No | - |
| PATCH | `/:id` | Update service | Yes | Admin |
| DELETE | `/:id` | Delete service | Yes | Admin |

---

## 1. Create Service

Create a new service. Admin only.

### Endpoint
```
POST /api/v1/services
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Admin role required.

### Request Body
```json
{
  "service_name": "Hatha Yoga Class",
  "description": "Traditional Hatha Yoga practice for all levels",
  "price": 500,
  "type": "class",
  "duration_minutes": 60,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Yoga",
  "image_url": "https://example.com/service-image.jpg",
  "is_active": true
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| service_name | string | Yes | Min 3 characters | Name of the service |
| description | string | Yes | Non-empty | Service description |
| price | number | Yes | Positive number | Service price |
| type | string | Yes | Non-empty | Service type (e.g., "class", "workshop") |
| duration_minutes | number | Yes | Positive number | Duration in minutes |
| trainer_id | string (UUID) | No | Valid UUID | Associated trainer ID |
| category | string | No | - | Service category |
| image_url | string | No | - | Service image URL |
| is_active | boolean | No | - | Active status (default: true) |

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "service_name": "Hatha Yoga Class",
  "description": "Traditional Hatha Yoga practice for all levels",
  "price": 500,
  "type": "class",
  "duration_minutes": 60,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Yoga",
  "image_url": "https://example.com/service-image.jpg",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/services",
  "method": "POST",
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
  "path": "/api/v1/services",
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
    "service_name must be longer than or equal to 3 characters",
    "price must be a positive number"
  ],
  "path": "/api/v1/services",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createService = async (serviceData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/services', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create service');
    }

    return data;
  } catch (error) {
    console.error('Create service error:', error);
    throw error;
  }
};

// Usage
createService({
  service_name: 'Hatha Yoga Class',
  description: 'Traditional Hatha Yoga practice',
  price: 500,
  type: 'class',
  duration_minutes: 60,
  is_active: true
});
```

---

## 2. Get All Services

Retrieve a list of all services. Optionally filter by type.

### Endpoint
```
GET /api/v1/services
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication required.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter services by type |

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "service_name": "Hatha Yoga Class",
    "description": "Traditional Hatha Yoga practice for all levels",
    "price": 500,
    "type": "class",
    "duration_minutes": 60,
    "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
    "category": "Yoga",
    "image_url": "https://example.com/service-image.jpg",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Service UUID |
| service_name | string | Service name |
| description | string | Service description |
| price | number | Service price |
| type | string | Service type |
| duration_minutes | number | Duration in minutes |
| trainer_id | string | Associated trainer UUID |
| category | string | Service category |
| image_url | string | Service image URL |
| is_active | boolean | Active status |
| created_at | string | Creation timestamp (ISO) |
| updated_at | string | Last update timestamp (ISO) |

### Example Request (JavaScript)
```javascript
const getAllServices = async (type = null) => {
  try {
    const url = type 
      ? `http://localhost:3000/api/v1/services?type=${type}`
      : 'http://localhost:3000/api/v1/services';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch services');
    }

    return data;
  } catch (error) {
    console.error('Get services error:', error);
    throw error;
  }
};

// Usage
getAllServices().then(services => {
  console.log('Services:', services);
});

// Filter by type
getAllServices('class').then(services => {
  console.log('Class services:', services);
});
```

---

## 3. Get Popular Services

Retrieve a list of popular services.

### Endpoint
```
GET /api/v1/services/popular
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication required.

### Query Parameters
None

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "service_name": "Hatha Yoga Class",
    "description": "Traditional Hatha Yoga practice for all levels",
    "price": 500,
    "type": "class",
    "duration_minutes": 60,
    "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
    "category": "Yoga",
    "image_url": "https://example.com/service-image.jpg",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getPopularServices = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/services/popular', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch popular services');
    }

    return data;
  } catch (error) {
    console.error('Get popular services error:', error);
    throw error;
  }
};

// Usage
getPopularServices().then(services => {
  console.log('Popular services:', services);
});
```

---

## 4. Get Service by ID

Retrieve a specific service by its ID.

### Endpoint
```
GET /api/v1/services/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Service UUID |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "service_name": "Hatha Yoga Class",
  "description": "Traditional Hatha Yoga practice for all levels",
  "price": 500,
  "type": "class",
  "duration_minutes": 60,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Yoga",
  "image_url": "https://example.com/service-image.jpg",
  "is_active": true,
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
  "message": "Service not found",
  "path": "/api/v1/services/123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getServiceById = async (serviceId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/services/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch service');
    }

    return data;
  } catch (error) {
    console.error('Get service error:', error);
    throw error;
  }
};

// Usage
getServiceById('123e4567-e89b-12d3-a456-426614174000').then(service => {
  console.log('Service:', service);
});
```

---

## 5. Get Services by Type

Retrieve services filtered by type.

### Endpoint
```
GET /api/v1/services/type/:type
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication required.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Service type (e.g., "class", "workshop") |

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "service_name": "Hatha Yoga Class",
    "description": "Traditional Hatha Yoga practice for all levels",
    "price": 500,
    "type": "class",
    "duration_minutes": 60,
    "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
    "category": "Yoga",
    "image_url": "https://example.com/service-image.jpg",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getServicesByType = async (type) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/services/type/${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch services');
    }

    return data;
  } catch (error) {
    console.error('Get services by type error:', error);
    throw error;
  }
};

// Usage
getServicesByType('class').then(services => {
  console.log('Class services:', services);
});
```

---

## 6. Update Service

Update an existing service. Admin only.

### Endpoint
```
PATCH /api/v1/services/:id
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
| id | string (UUID) | Yes | Service UUID |

### Request Body
All fields are optional (partial update):
```json
{
  "service_name": "Updated Service Name",
  "price": 600,
  "is_active": false
}
```

### Request Body Schema
Same as Create Service, but all fields are optional.

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "service_name": "Updated Service Name",
  "description": "Traditional Hatha Yoga practice for all levels",
  "price": 600,
  "type": "class",
  "duration_minutes": 60,
  "trainer_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Yoga",
  "image_url": "https://example.com/service-image.jpg",
  "is_active": false,
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
  "message": "Service not found",
  "path": "/api/v1/services/123e4567-e89b-12d3-a456-426614174000",
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
  "path": "/api/v1/services/123e4567-e89b-12d3-a456-426614174000",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateService = async (serviceId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/services/${serviceId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update service');
    }

    return data;
  } catch (error) {
    console.error('Update service error:', error);
    throw error;
  }
};

// Usage
updateService('123e4567-e89b-12d3-a456-426614174000', {
  price: 600,
  is_active: false
});
```

---

## 7. Delete Service

Delete a service. Admin only.

### Endpoint
```
DELETE /api/v1/services/:id
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
| id | string (UUID) | Yes | Service UUID |

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
  "message": "Service not found",
  "path": "/api/v1/services/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
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
  "path": "/api/v1/services/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const deleteService = async (serviceId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/services/${serviceId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete service');
    }

    return true; // Success
  } catch (error) {
    console.error('Delete service error:', error);
    throw error;
  }
};

// Usage
deleteService('123e4567-e89b-12d3-a456-426614174000');
```

---

## 📝 Complete Service Service Example

```javascript
class ServiceService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getAll(type = null) {
    const url = type 
      ? `${this.baseURL}/services?type=${type}`
      : `${this.baseURL}/services`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getPopular() {
    const response = await fetch(`${this.baseURL}/services/popular`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/services/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getByType(type) {
    const response = await fetch(`${this.baseURL}/services/type/${type}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async create(serviceData) {
    const response = await fetch(`${this.baseURL}/services`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    return this.handleResponse(response);
  }

  async update(id, updateData) {
    const response = await fetch(`${this.baseURL}/services/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async delete(id) {
    const response = await fetch(`${this.baseURL}/services/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete service');
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
const serviceService = new ServiceService('http://localhost:3000/api/v1');

// Get all services
const services = await serviceService.getAll();

// Get popular services
const popular = await serviceService.getPopular();

// Get service by ID
const service = await serviceService.getById('123e4567-e89b-12d3-a456-426614174000');

// Create service (admin only)
await serviceService.create({
  service_name: 'Hatha Yoga',
  description: 'Traditional practice',
  price: 500,
  type: 'class',
  duration_minutes: 60
});
```

