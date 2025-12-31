# Trainers Integration Guide

Complete guide for integrating trainer management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/trainers
```

## ⭐ Trainer Ratings & Reviews

Trainer `rating` and `total_reviews` are **automatically calculated** from approved reviews:

- **Rating**: Average rating (0-5) from all approved reviews linked through bookings
- **Total Reviews**: Count of all approved reviews for the trainer
- **Initial State**: New trainers start with `rating: 0` and `total_reviews: 0`
- **Automatic Updates**: Ratings are recalculated when:
  - A review is approved
  - An approved review's rating is updated
  - An approved review is deleted/unapproved

**Note:** Only approved reviews count towards trainer ratings. Pending reviews do not affect ratings.

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/` | Create a new trainer | Yes | Admin |
| GET | `/` | Get all trainers | Yes | Any |
| GET | `/:id` | Get trainer by ID | Yes | Any |
| PUT | `/:id` | Update trainer | Yes | Admin |
| DELETE | `/:id` | Delete trainer | Yes | Admin |

---

## 1. Create Trainer

Create a new trainer profile. Admin only.

### Endpoint
```
POST /api/v1/trainers
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
  "name": "Preeti",
  "title": "Founder & Head Trainer",
  "bio": "With over 15 years of experience in yoga and fitness, Preeti has dedicated her life to helping others achieve their wellness goals through holistic practices.",
  "specializations": ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Prenatal Yoga"],
  "profileImage": "https://example.com/profile.jpg",
  "certifications": ["RYT 500 Yoga Alliance Certified", "Prenatal & Postnatal Yoga Specialist", "Yoga Therapy Certification", "Certified Nutritionist"],
  "experienceYears": 15,
  "availability": {
    "monday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "tuesday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "wednesday": [
      { "start": "09:00", "end": "17:00" }
    ]
  },
  "isActive": true,
  "socialMedia": {
    "instagram": "yogamaster",
    "youtube": "yogamaster"
  }
}
```

### Request Body Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Trainer's full name |
| title | string | No | Trainer's title/position (e.g., "Founder & Head Trainer") |
| bio | string | No | Trainer's biography |
| specializations | string[] | No | Array of specialization strings |
| profileImage | string | No | URL to trainer's profile image |
| certifications | string[] | No | Array of certification strings |
| experienceYears | number | No | Years of experience |
| availability | object | No | Availability schedule by day of week |
| isActive | boolean | No | Whether trainer is active (default: true) |
| socialMedia | object | No | Social media links (instagram, youtube, etc.) |

### Availability Object Structure
```json
{
  "monday": [
    { "start": "09:00", "end": "17:00" }
  ],
  "tuesday": [
    { "start": "09:00", "end": "12:00" },
    { "start": "14:00", "end": "17:00" }
  ]
}
```

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Preeti",
  "title": "Founder & Head Trainer",
  "bio": "With over 15 years of experience in yoga and fitness, Preeti has dedicated her life to helping others achieve their wellness goals through holistic practices.",
  "specializations": ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Prenatal Yoga"],
  "profileImage": "https://example.com/profile.jpg",
  "certifications": ["RYT 500 Yoga Alliance Certified", "Prenatal & Postnatal Yoga Specialist", "Yoga Therapy Certification", "Certified Nutritionist"],
  "experienceYears": 15,
  "rating": 0,
  "totalReviews": 0,
  "isActive": true,
  "socialMedia": {
    "instagram": "yogamaster",
    "youtube": "yogamaster"
  },
  "availability": {
    "monday": ["09:00-17:00"],
    "tuesday": ["09:00-17:00"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
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
  "path": "/api/v1/trainers",
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
  "path": "/api/v1/trainers",
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
  "message": ["name should not be empty"],
  "path": "/api/v1/trainers",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createTrainer = async (trainerData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/trainers', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainerData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create trainer');
    }

    return data;
  } catch (error) {
    console.error('Create trainer error:', error);
    throw error;
  }
};

// Usage
createTrainer({
  name: 'Preeti',
  title: 'Founder & Head Trainer',
  bio: 'With over 15 years of experience in yoga and fitness',
  specializations: ['Hatha Yoga', 'Vinyasa Flow', 'Meditation', 'Prenatal Yoga'],
  certifications: ['RYT 500 Yoga Alliance Certified', 'Prenatal & Postnatal Yoga Specialist'],
  experienceYears: 15,
  isActive: true
});
```

---

## 2. Get All Trainers

Retrieve a list of all trainers.

### Endpoint
```
GET /api/v1/trainers
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

### Query Parameters
None

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Preeti",
    "title": "Founder & Head Trainer",
    "bio": "With over 15 years of experience in yoga and fitness, Preeti has dedicated her life to helping others achieve their wellness goals through holistic practices.",
    "specializations": ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Prenatal Yoga"],
    "profileImage": "https://example.com/profile.jpg",
    "certifications": ["RYT 500 Yoga Alliance Certified", "Prenatal & Postnatal Yoga Specialist"],
    "experienceYears": 15,
    "rating": 4.5,
    "totalReviews": 10,
    "isActive": true,
    "socialMedia": {
      "instagram": "yogamaster",
      "youtube": "yogamaster"
    },
    "availability": {
      "monday": ["09:00-17:00"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Trainer UUID |
| name | string | Trainer's full name |
| title | string \| null | Trainer's title/position (e.g., "Founder & Head Trainer") |
| bio | string | Trainer's biography |
| specializations | string[] | Array of specializations |
| profileImage | string | Profile image URL |
| certifications | string[] | Array of certifications |
| experienceYears | number | Years of experience |
| rating | number | Average rating (0-5) |
| totalReviews | number | Total number of reviews |
| isActive | boolean | Active status |
| socialMedia | object | Social media links |
| availability | object | Availability schedule |
| createdAt | string | Creation timestamp (ISO) |
| updatedAt | string | Last update timestamp (ISO) |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/trainers",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getAllTrainers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/trainers', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch trainers');
    }

    return data;
  } catch (error) {
    console.error('Get trainers error:', error);
    throw error;
  }
};

// Usage
getAllTrainers().then(trainers => {
  console.log('Trainers:', trainers);
});
```

---

## 3. Get Trainer by ID

Retrieve a specific trainer by their ID.

### Endpoint
```
GET /api/v1/trainers/:id
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
| id | string (UUID) | Yes | Trainer UUID |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Preeti",
  "title": "Founder & Head Trainer",
  "bio": "With over 15 years of experience in yoga and fitness, Preeti has dedicated her life to helping others achieve their wellness goals through holistic practices.",
  "specializations": ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Prenatal Yoga"],
  "profileImage": "https://example.com/profile.jpg",
  "certifications": ["RYT 500 Yoga Alliance Certified", "Prenatal & Postnatal Yoga Specialist"],
  "experienceYears": 15,
  "rating": 4.5,
  "totalReviews": 10,
  "isActive": true,
  "socialMedia": {
    "instagram": "yogamaster",
    "youtube": "yogamaster"
  },
  "availability": {
    "monday": ["09:00-17:00"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Trainer not found",
  "path": "/api/v1/trainers/123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 400 Bad Request - Invalid UUID
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed (uuid is expected)",
  "path": "/api/v1/trainers/invalid-id",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getTrainerById = async (trainerId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/trainers/${trainerId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch trainer');
    }

    return data;
  } catch (error) {
    console.error('Get trainer error:', error);
    throw error;
  }
};

// Usage
getTrainerById('123e4567-e89b-12d3-a456-426614174000').then(trainer => {
  console.log('Trainer:', trainer);
});
```

---

## 4. Update Trainer

Update an existing trainer. Admin only.

### Endpoint
```
PUT /api/v1/trainers/:id
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
| id | string (UUID) | Yes | Trainer UUID |

### Request Body
All fields are optional (partial update):
```json
{
  "name": "Preeti",
  "title": "Founder & Head Trainer",
  "bio": "Updated bio",
  "specializations": ["Hatha Yoga"],
  "isActive": false
}
```

### Request Body Schema
Same as Create Trainer, but all fields are optional.

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Preeti",
  "title": "Founder & Head Trainer",
  "bio": "Updated bio",
  "specializations": ["Hatha Yoga"],
  "profileImage": "https://example.com/profile.jpg",
  "certifications": ["RYT 500 Yoga Alliance Certified"],
  "experienceYears": 15,
  "rating": 4.5,
  "totalReviews": 10,
  "isActive": false,
  "socialMedia": {
    "instagram": "yogamaster"
  },
  "availability": {
    "monday": ["09:00-17:00"]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Trainer not found",
  "path": "/api/v1/trainers/123e4567-e89b-12d3-a456-426614174000",
  "method": "PUT",
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
  "path": "/api/v1/trainers/123e4567-e89b-12d3-a456-426614174000",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateTrainer = async (trainerId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/trainers/${trainerId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update trainer');
    }

    return data;
  } catch (error) {
    console.error('Update trainer error:', error);
    throw error;
  }
};

// Usage
updateTrainer('123e4567-e89b-12d3-a456-426614174000', {
  name: 'Jane Doe',
  isActive: false
});
```

---

## 5. Delete Trainer

Delete a trainer. Admin only.

### Endpoint
```
DELETE /api/v1/trainers/:id
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
| id | string (UUID) | Yes | Trainer UUID |

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
  "message": "Trainer not found",
  "path": "/api/v1/trainers/123e4567-e89b-12d3-a456-426614174000",
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
  "path": "/api/v1/trainers/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const deleteTrainer = async (trainerId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/trainers/${trainerId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete trainer');
    }

    return true; // Success
  } catch (error) {
    console.error('Delete trainer error:', error);
    throw error;
  }
};

// Usage
deleteTrainer('123e4567-e89b-12d3-a456-426614174000');
```

---

## 📝 Complete Trainer Service Example

```javascript
class TrainerService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getAll() {
    const response = await fetch(`${this.baseURL}/trainers`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/trainers/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async create(trainerData) {
    const response = await fetch(`${this.baseURL}/trainers`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainerData)
    });
    return this.handleResponse(response);
  }

  async update(id, updateData) {
    const response = await fetch(`${this.baseURL}/trainers/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async delete(id) {
    const response = await fetch(`${this.baseURL}/trainers/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete trainer');
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
const trainerService = new TrainerService('http://localhost:3000/api/v1');

// Get all trainers
const trainers = await trainerService.getAll();

// Get trainer by ID
const trainer = await trainerService.getById('123e4567-e89b-12d3-a456-426614174000');

// Create trainer (admin only)
await trainerService.create({
  name: 'Preeti',
  title: 'Founder & Head Trainer',
  bio: 'With over 15 years of experience in yoga and fitness',
  specializations: ['Hatha Yoga', 'Vinyasa Flow', 'Meditation', 'Prenatal Yoga'],
  certifications: ['RYT 500 Yoga Alliance Certified', 'Prenatal & Postnatal Yoga Specialist'],
  experienceYears: 15
});

// Update trainer (admin only)
await trainerService.update('123e4567-e89b-12d3-a456-426614174000', {
  isActive: false
});

// Delete trainer (admin only)
await trainerService.delete('123e4567-e89b-12d3-a456-426614174000');
```

