# Reviews Integration Guide

Complete guide for integrating review management endpoints with the Fitpreeti Yoga Backend API.

## Base URL
```
/api/v1/reviews
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/` | Create a new review | Yes | Any |
| GET | `/` | Get all reviews (approved by default) | No | - |
| GET | `/approved` | Get all approved reviews | No | - |
| GET | `/pending` | Get pending reviews | Yes | Admin |
| GET | `/my-reviews` | Get user's reviews | Yes | Any |
| GET | `/:id` | Get review by ID | No | - |
| PATCH | `/:id` | Update review | Yes | Owner/Admin |
| DELETE | `/:id` | Delete review | Yes | Owner/Admin |

---

## 1. Create Review

Create a new review for a service or booking.

### Endpoint
```
POST /api/v1/reviews
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). User is automatically associated with the review.

### Request Body
```json
{
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Excellent yoga class! The instructor was very knowledgeable and the atmosphere was peaceful.",
  "reviewer_type": "Yoga Regular"
}
```

### Request Body Schema
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| booking_id | string (UUID) | No | Valid UUID | Associated booking UUID |
| rating | number | Yes | 1-5 | Rating from 1 to 5 |
| comment | string | Yes | Max 1000 characters | Review comment |
| reviewer_type | string | No | Max 100 characters | Type of reviewer (e.g., "Yoga Regular") |

### Success Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_name": "John Doe",
  "user_profile_image": null,
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Excellent yoga class! The instructor was very knowledgeable and the atmosphere was peaceful.",
  "reviewer_type": "Yoga Regular",
  "is_approved": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| id | string | Review UUID |
| user_id | string | User UUID who created the review |
| user_name | string | User's name |
| user_profile_image | string \| null | User's profile image URL |
| booking_id | string \| null | Associated booking UUID |
| rating | number | Rating (1-5) |
| comment | string | Review comment |
| reviewer_type | string \| null | Reviewer type |
| is_approved | boolean | Approval status (default: false) |
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
    "rating must not be less than 1",
    "comment should not be empty"
  ],
  "path": "/api/v1/reviews",
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
  "path": "/api/v1/reviews",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const createReview = async (reviewData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/reviews', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create review');
    }

    return data;
  } catch (error) {
    console.error('Create review error:', error);
    throw error;
  }
};

// Usage
createReview({
  booking_id: '123e4567-e89b-12d3-a456-426614174000',
  rating: 5,
  comment: 'Excellent yoga class!',
  reviewer_type: 'Yoga Regular'
});
```

---

## 2. Get All Reviews

Get all reviews. By default, returns only approved reviews. Can filter by approval status.

### Endpoint
```
GET /api/v1/reviews
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
| approved | boolean | No | Filter by approval status (default: true) |

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_name": "John Doe",
    "user_profile_image": null,
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 5,
    "comment": "Excellent yoga class!",
    "reviewer_type": "Yoga Regular",
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getAllReviews = async (approvedOnly = true) => {
  try {
    const url = `http://localhost:3000/api/v1/reviews?approved=${approvedOnly}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reviews');
    }

    return data;
  } catch (error) {
    console.error('Get reviews error:', error);
    throw error;
  }
};

// Usage
getAllReviews().then(reviews => {
  console.log('Approved reviews:', reviews);
});

// Get all reviews including pending
getAllReviews(false).then(reviews => {
  console.log('All reviews:', reviews);
});
```

---

## 3. Get Approved Reviews

Get all approved reviews.

### Endpoint
```
GET /api/v1/reviews/approved
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** No authentication required.

### Request Body
None required

### Success Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_name": "John Doe",
    "user_profile_image": null,
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 5,
    "comment": "Excellent yoga class!",
    "reviewer_type": "Yoga Regular",
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getApprovedReviews = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/reviews/approved', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch approved reviews');
    }

    return data;
  } catch (error) {
    console.error('Get approved reviews error:', error);
    throw error;
  }
};

// Usage
getApprovedReviews().then(reviews => {
  console.log('Approved reviews:', reviews);
});
```

---

## 4. Get Pending Reviews (Admin Only)

Get all pending reviews that need approval. Admin only.

### Endpoint
```
GET /api/v1/reviews/pending
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
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_name": "John Doe",
    "user_profile_image": null,
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 5,
    "comment": "Excellent yoga class!",
    "reviewer_type": "Yoga Regular",
    "is_approved": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Error Responses

#### 403 Forbidden - Not Admin
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/reviews/pending",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getPendingReviews = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/reviews/pending', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch pending reviews');
    }

    return data;
  } catch (error) {
    console.error('Get pending reviews error:', error);
    throw error;
  }
};

// Usage (Admin only)
getPendingReviews().then(reviews => {
  console.log('Pending reviews:', reviews);
});
```

---

## 5. Get My Reviews

Get all reviews created by the authenticated user.

### Endpoint
```
GET /api/v1/reviews/my-reviews
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
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "user_name": "John Doe",
    "user_profile_image": null,
    "booking_id": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 5,
    "comment": "Excellent yoga class!",
    "reviewer_type": "Yoga Regular",
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Example Request (JavaScript)
```javascript
const getMyReviews = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/reviews/my-reviews', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch my reviews');
    }

    return data;
  } catch (error) {
    console.error('Get my reviews error:', error);
    throw error;
  }
};

// Usage
getMyReviews().then(reviews => {
  console.log('My reviews:', reviews);
});
```

---

## 6. Get Review by ID

Get a specific review by its ID.

### Endpoint
```
GET /api/v1/reviews/:id
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
| id | string (UUID) | Yes | Review UUID |

### Request Body
None required

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_name": "John Doe",
  "user_profile_image": null,
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Excellent yoga class!",
  "reviewer_type": "Yoga Regular",
  "is_approved": true,
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
  "message": "Review not found",
  "path": "/api/v1/reviews/123e4567-e89b-12d3-a456-426614174000",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const getReviewById = async (reviewId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/reviews/${reviewId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch review');
    }

    return data;
  } catch (error) {
    console.error('Get review error:', error);
    throw error;
  }
};

// Usage
getReviewById('123e4567-e89b-12d3-a456-426614174000').then(review => {
  console.log('Review:', review);
});
```

---

## 7. Update Review

Update a review. Users can only update their own reviews. Admins can update any review.

### Endpoint
```
PATCH /api/v1/reviews/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Users can only update their own reviews.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Review UUID |

### Request Body
All fields are optional (partial update):
```json
{
  "rating": 4,
  "comment": "Updated comment",
  "reviewer_type": "Updated Type",
  "is_approved": true
}
```

### Request Body Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rating | number | No | Rating from 1 to 5 |
| comment | string | No | Review comment (max 1000 chars) |
| reviewer_type | string | No | Reviewer type (max 100 chars) |
| is_approved | boolean | No | Approval status (Admin only) |

### Success Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "user_name": "John Doe",
  "user_profile_image": null,
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 4,
  "comment": "Updated comment",
  "reviewer_type": "Updated Type",
  "is_approved": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T01:00:00.000Z"
}
```

### Error Responses

#### 403 Forbidden - Not Owner
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You can only update your own reviews",
  "path": "/api/v1/reviews/123e4567-e89b-12d3-a456-426614174000",
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
  "message": "Review not found",
  "path": "/api/v1/reviews/123e4567-e89b-12d3-a456-426614174000",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const updateReview = async (reviewId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/reviews/${reviewId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update review');
    }

    return data;
  } catch (error) {
    console.error('Update review error:', error);
    throw error;
  }
};

// Usage
updateReview('123e4567-e89b-12d3-a456-426614174000', {
  rating: 4,
  comment: 'Updated comment'
});

// Admin can approve reviews
updateReview('123e4567-e89b-12d3-a456-426614174000', {
  is_approved: true
});
```

---

## 8. Delete Review

Delete a review. Users can only delete their own reviews. Admins can delete any review.

### Endpoint
```
DELETE /api/v1/reviews/:id
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies are automatically sent). Users can only delete their own reviews.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Review UUID |

### Request Body
None required

### Success Response (204 No Content)
No response body. Status code 204 indicates successful deletion.

### Error Responses

#### 403 Forbidden - Not Owner
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You can only delete your own reviews",
  "path": "/api/v1/reviews/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Review not found",
  "path": "/api/v1/reviews/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Example Request (JavaScript)
```javascript
const deleteReview = async (reviewId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete review');
    }

    return true; // Success
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
};

// Usage
deleteReview('123e4567-e89b-12d3-a456-426614174000');
```

---

## 📝 Complete Review Service Example

```javascript
class ReviewService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async create(reviewData) {
    const response = await fetch(`${this.baseURL}/reviews`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    return this.handleResponse(response);
  }

  async getAll(approvedOnly = true) {
    const url = `${this.baseURL}/reviews?approved=${approvedOnly}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getApproved() {
    const response = await fetch(`${this.baseURL}/reviews/approved`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getPending() {
    const response = await fetch(`${this.baseURL}/reviews/pending`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getMyReviews() {
    const response = await fetch(`${this.baseURL}/reviews/my-reviews`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/reviews/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return this.handleResponse(response);
  }

  async update(id, updateData) {
    const response = await fetch(`${this.baseURL}/reviews/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return this.handleResponse(response);
  }

  async delete(id) {
    const response = await fetch(`${this.baseURL}/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete review');
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
const reviewService = new ReviewService('http://localhost:3000/api/v1');

// Create review
await reviewService.create({
  booking_id: '123e4567-e89b-12d3-a456-426614174000',
  rating: 5,
  comment: 'Excellent class!',
  reviewer_type: 'Yoga Regular'
});

// Get approved reviews
const reviews = await reviewService.getApproved();

// Get my reviews
const myReviews = await reviewService.getMyReviews();

// Update review
await reviewService.update('123e4567-e89b-12d3-a456-426614174000', {
  rating: 4,
  comment: 'Updated comment'
});

// Delete review
await reviewService.delete('123e4567-e89b-12d3-a456-426614174000');
```

