# CMS System API Specification for Frontend Integration

## Overview

This document specifies the API requirements for the CMS (Content Management System) modules that the frontend team needs to integrate with. The CMS consists of two main modules:

1. **Institute Info Module** - Singleton record for contact information
2. **Content Sections Module** - Flexible key-based sections supporting multiple items per section type

---

## API Base Configuration

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
- All endpoints use **Cookie-based JWT authentication**
- Admin endpoints require `@Roles('admin')` guard
- Requests must include `credentials: 'include'` for cookies
- Headers: `Content-Type: application/json`

### Response Format Standard

**Success Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response Format:**
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

**Important Notes:**
- Response data should be wrapped in the standard format with `data` field
- The frontend expects responses in `ApiResponse<T>` format
- Error messages can be either a string or an array of strings
- All timestamps should be in ISO 8601 format

---

## Module 1: Institute Info API

### Base URL
```
/api/v1/institute-info
```

### Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/institute-info` | Get institute contact info | No | - |
| PUT | `/api/v1/institute-info` | Create/Update institute info | Yes | Admin |

---

### 1. GET Institute Info

Retrieve the institute contact information. Public endpoint.

#### Endpoint
```
GET /api/v1/institute-info
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

#### Request Body
None

#### Success Response (200 OK)

**Response Format:**
```json
{
  "success": true,
  "message": "Institute info retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "location": "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
    "phone_numbers": ["+91 9876543210", "+91 7039142314"],
    "email": "hello@fitpreeti.com",
    "social_media": {
      "instagram": "https://instagram.com/fitpreeti",
      "facebook": "https://facebook.com/fitpreeti",
      "youtube": "https://youtube.com/fitpreeti"
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Data Structure Schema:**
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| location | string | Physical address of the institute |
| phone_numbers | string[] | Array of phone numbers |
| email | string | Contact email address |
| social_media | object | Social media links object |
| social_media.instagram | string \| null | Instagram URL (optional) |
| social_media.facebook | string \| null | Facebook URL (optional) |
| social_media.youtube | string \| null | YouTube URL (optional) |
| created_at | string (ISO 8601) | Creation timestamp |
| updated_at | string (ISO 8601) | Last update timestamp |

#### Error Responses

**404 Not Found (when no record exists):**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Institute info not found",
  "path": "/api/v1/institute-info",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** If no record exists yet, the backend should return 404 or an empty object. The frontend will handle both cases.

---

### 2. PUT Institute Info

Create or update institute information. Admin only. This is a singleton - only one record should exist.

#### Endpoint
```
PUT /api/v1/institute-info
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies). Admin role required.

#### Request Body
```json
{
  "location": "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
  "phone_numbers": ["+91 9876543210", "+91 7039142314"],
  "email": "hello@fitpreeti.com",
  "social_media": {
    "instagram": "https://instagram.com/fitpreeti",
    "facebook": "https://facebook.com/fitpreeti",
    "youtube": "https://youtube.com/fitpreeti"
  }
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| location | string | Yes | Non-empty string | Physical address |
| phone_numbers | string[] | Yes | Array with at least one item | Array of phone numbers |
| email | string | Yes | Valid email format | Contact email |
| social_media | object | No | - | Social media links object |
| social_media.instagram | string | No | Valid URL format | Instagram URL |
| social_media.facebook | string | No | Valid URL format | Facebook URL |
| social_media.youtube | string | No | Valid URL format | YouTube URL |

**Note:** `social_media` fields are optional. If provided, they should be valid URLs. Null values are acceptable.

#### Success Response

**200 OK (Updated):**
```json
{
  "success": true,
  "message": "Institute info updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "location": "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
    "phone_numbers": ["+91 9876543210", "+91 7039142314"],
    "email": "hello@fitpreeti.com",
    "social_media": {
      "instagram": "https://instagram.com/fitpreeti",
      "facebook": "https://facebook.com/fitpreeti",
      "youtube": "https://youtube.com/fitpreeti"
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**201 Created (New Record):**
```json
{
  "success": true,
  "message": "Institute info created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "location": "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
    "phone_numbers": ["+91 9876543210", "+91 7039142314"],
    "email": "hello@fitpreeti.com",
    "social_media": {
      "instagram": "https://instagram.com/fitpreeti",
      "facebook": "https://facebook.com/fitpreeti",
      "youtube": "https://youtube.com/fitpreeti"
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/institute-info",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**403 Forbidden - Not Admin:**
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/institute-info",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "location should not be empty",
    "email must be an email",
    "phone_numbers must be an array"
  ],
  "path": "/api/v1/institute-info",
  "method": "PUT",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Implementation Notes for Backend

- **Singleton Pattern:** Only one record should exist. If updating, replace the existing record. If creating and a record already exists, update it instead of creating a duplicate.
- **Database:** Use ReplacingMergeTree engine in ClickHouse to ensure single record pattern
- **Use parameterized queries** for all database operations (security requirement)

---

## Module 2: Content Sections API

### Base URL
```
/api/v1/content-sections
```

### Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/content-sections` | Get all active sections (grouped by key) | No | - |
| GET | `/api/v1/content-sections/:key` | Get sections by key | No | - |
| POST | `/api/v1/content-sections` | Create new section | Yes | Admin |
| PATCH | `/api/v1/content-sections/:id` | Update section | Yes | Admin |
| DELETE | `/api/v1/content-sections/:id` | Delete section (soft delete via is_active) | Yes | Admin |

---

### 1. GET All Content Sections

Retrieve all active content sections, grouped by section_key. Public endpoint.

#### Endpoint
```
GET /api/v1/content-sections
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| include_inactive | boolean | No | Include inactive sections (default: false) |

#### Request Body
None

#### Success Response (200 OK)

**Response Format (Grouped by key):**
```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": {
    "hero": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "section_key": "hero",
        "content": {
          "title": "Welcome to FitPreeti Yoga",
          "subtitle": "Transform your body and mind",
          "cta_button": {
            "text": "Book Now",
            "link": "/book"
          },
          "image_url": "https://example.com/hero.jpg"
        },
        "order": 0,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "announcements": [
      {
        "id": "223e4567-e89b-12d3-a456-426614174001",
        "section_key": "announcements",
        "content": {
          "title": "New Class Schedule",
          "message": "Check out our new morning classes",
          "link": "/schedule",
          "priority": "high"
        },
        "order": 0,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "323e4567-e89b-12d3-a456-426614174002",
        "section_key": "announcements",
        "content": {
          "title": "Holiday Special",
          "message": "20% off on all classes",
          "link": "/offers",
          "priority": "medium"
        },
        "order": 1,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Alternative Response Format (Flat array, if grouping is complex):**
If grouping is not possible, return a flat array sorted by section_key and order:
```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "section_key": "announcements",
      "content": { /* ... */ },
      "order": 0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
    /* ... more items sorted by section_key, then order */
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Data Structure Schema:**
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| section_key | string (LowCardinality) | Section identifier (e.g., "hero", "announcements") |
| content | object (JSON) | Flexible JSON structure - varies by section type |
| order | number (UInt32) | Sort order within the same section_key |
| is_active | boolean | Whether the section is active |
| created_at | string (ISO 8601) | Creation timestamp |
| updated_at | string (ISO 8601) | Last update timestamp |

**Important:** 
- By default, only return sections where `is_active = true`
- If `include_inactive=true` query parameter is provided, return all sections
- Sections should be sorted by `section_key` first, then by `order` ascending

---

### 2. GET Content Sections by Key

Retrieve all active sections for a specific key. Public endpoint.

#### Endpoint
```
GET /api/v1/content-sections/:key
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Section key (e.g., "hero", "announcements") |

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

#### Request Body
None

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "section_key": "announcements",
      "content": {
        "title": "New Class Schedule",
        "message": "Check out our new morning classes",
        "link": "/schedule",
        "priority": "high"
      },
      "order": 0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "section_key": "announcements",
      "content": {
        "title": "Holiday Special",
        "message": "20% off on all classes",
        "link": "/offers",
        "priority": "medium"
      },
      "order": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** 
- Returns an array (even for sections that typically have one item like "hero")
- Only returns active sections (`is_active = true`)
- Sorted by `order` ascending

#### Error Responses

**404 Not Found (invalid key or no sections):**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "No content sections found for key: invalid_key",
  "path": "/api/v1/content-sections/invalid_key",
  "method": "GET",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** If no sections exist for the key, return 404 or an empty array `[]`. The frontend can handle both.

---

### 3. POST Create Content Section

Create a new content section. Admin only.

#### Endpoint
```
POST /api/v1/content-sections
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies). Admin role required.

#### Request Body

**Example 1: Hero Section**
```json
{
  "section_key": "hero",
  "content": {
    "title": "Welcome to FitPreeti Yoga",
    "subtitle": "Transform your body and mind",
    "cta_button": {
      "text": "Book Now",
      "link": "/book"
    },
    "image_url": "https://example.com/hero.jpg"
  },
  "order": 0,
  "is_active": true
}
```

**Example 2: Announcement**
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Class Schedule",
    "message": "Check out our new morning classes",
    "link": "/schedule",
    "priority": "high"
  },
  "order": 0,
  "is_active": true
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| section_key | string | Yes | Non-empty string, LowCardinality | Section identifier (e.g., "hero", "announcements") |
| content | object (JSON) | Yes | Valid JSON object | Flexible content structure (validated by section type if needed) |
| order | number | Yes | Integer, >= 0 | Sort order (default: 0) |
| is_active | boolean | No | - | Active status (default: true) |

**Note:** The `content` field is flexible JSON. The backend should accept any valid JSON structure. Frontend will handle structure validation per section type.

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Content section created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "section_key": "announcements",
    "content": {
      "title": "New Class Schedule",
      "message": "Check out our new morning classes",
      "link": "/schedule",
      "priority": "high"
    },
    "order": 0,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/api/v1/content-sections",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**403 Forbidden - Not Admin:**
```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "path": "/api/v1/content-sections",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "section_key should not be empty",
    "content must be an object",
    "order must be a positive number"
  ],
  "path": "/api/v1/content-sections",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. PATCH Update Content Section

Update an existing content section. Admin only.

#### Endpoint
```
PATCH /api/v1/content-sections/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Section ID |

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies). Admin role required.

#### Request Body

All fields are optional (partial update):

```json
{
  "section_key": "announcements",
  "content": {
    "title": "Updated Title",
    "message": "Updated message",
    "link": "/new-link",
    "priority": "low"
  },
  "order": 1,
  "is_active": false
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| section_key | string | No | Non-empty string | Section identifier |
| content | object (JSON) | No | Valid JSON object | Flexible content structure |
| order | number | No | Integer, >= 0 | Sort order |
| is_active | boolean | No | - | Active status |

**Note:** Only include fields that should be updated. The backend should merge with existing data.

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Content section updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "section_key": "announcements",
    "content": {
      "title": "Updated Title",
      "message": "Updated message",
      "link": "/new-link",
      "priority": "low"
    },
    "order": 1,
    "is_active": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T01:00:00.000Z"
  },
  "timestamp": "2024-01-01T01:00:00.000Z"
}
```

#### Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Content section not found",
  "path": "/api/v1/content-sections/123e4567-e89b-12d3-a456-426614174000",
  "method": "PATCH",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**401 Unauthorized / 403 Forbidden:** Same as POST endpoint.

**400 Bad Request - Validation Error:** Same format as POST endpoint.

---

### 5. DELETE Content Section

Delete (deactivate) a content section. Admin only.

**Note:** Implement as a soft delete by setting `is_active = false` instead of hard deletion.

#### Endpoint
```
DELETE /api/v1/content-sections/:id
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Section ID |

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

**Note:** Requires authentication (cookies). Admin role required.

#### Request Body
None

#### Success Response

**Option 1: 200 OK with message (Recommended):**
```json
{
  "success": true,
  "message": "Content section deleted successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "is_active": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Option 2: 204 No Content (Alternative):**
```
Status: 204 No Content
(Empty response body)
```

#### Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "Not Found",
  "message": "Content section not found",
  "path": "/api/v1/content-sections/123e4567-e89b-12d3-a456-426614174000",
  "method": "DELETE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**401 Unauthorized / 403 Forbidden:** Same as other endpoints.

---

## Data Structure Examples

### Content Section Examples

#### Hero Section
```json
{
  "section_key": "hero",
  "content": {
    "title": "Welcome to FitPreeti Yoga Institute",
    "subtitle": "Transform your body and mind through ancient practices",
    "cta_button": {
      "text": "Book a Class",
      "link": "/booking"
    },
    "image_url": "https://example.com/hero-image.jpg",
    "background_color": "#f0f0f0"
  },
  "order": 0,
  "is_active": true
}
```

#### Announcements Section (Multiple Items)
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Morning Classes",
    "message": "Join us for our new 6 AM morning yoga sessions",
    "link": "/schedule",
    "priority": "high",
    "icon": "bell"
  },
  "order": 0,
  "is_active": true
}
```

#### Testimonials Section (if needed)
```json
{
  "section_key": "testimonials",
  "content": {
    "name": "John Doe",
    "rating": 5,
    "comment": "Amazing experience!",
    "image_url": "https://example.com/avatar.jpg"
  },
  "order": 0,
  "is_active": true
}
```

---

## Implementation Requirements for Backend Team

### Security

1. **Parameterized Queries:** All database operations MUST use parameterized queries (no string concatenation)
2. **Authentication:** Admin endpoints must use `@UseGuards(CookieJwtGuard, RolesGuard)` and `@Roles('admin')`
3. **Input Validation:** Validate all inputs using DTOs with class-validator
4. **CORS:** Ensure CORS is configured to allow credentials from frontend origin

### Database

1. **ClickHouse Tables:**
   - `institute_info`: ReplacingMergeTree engine (singleton pattern)
   - `content_sections`: MergeTree engine (allows multiple records)
   - Index `content_sections` by `section_key` and `order` for efficient queries

2. **JSON Fields:**
   - `phone_numbers` in `institute_info` should be stored as JSON array
   - `social_media` in `institute_info` should be stored as JSON object
   - `content` in `content_sections` should be stored as JSON string/object

### Response Format

1. **Always wrap responses** in the standard format:
   ```json
   {
     "success": boolean,
     "message": string,
     "data": T,
     "timestamp": string (ISO 8601)
   }
   ```

2. **Error responses** should include:
   - `statusCode`: HTTP status code
   - `error`: Error type (e.g., "Bad Request", "Unauthorized")
   - `message`: Error message (string or array of strings)
   - `path`: Request path
   - `method`: HTTP method
   - `timestamp`: ISO 8601 timestamp

### Special Considerations

1. **Institute Info Singleton:**
   - Only one record should exist
   - If record exists, UPDATE it
   - If no record exists, CREATE it
   - Use ReplacingMergeTree to handle duplicates at database level

2. **Content Sections:**
   - Support multiple items per `section_key`
   - Sort by `order` field (ascending)
   - Filter by `is_active = true` by default (unless `include_inactive=true`)
   - For GET all, consider grouping by `section_key` (preferred) or return flat array

3. **Soft Delete:**
   - DELETE endpoint should set `is_active = false` (soft delete)
   - Do NOT hard delete records

---

## HTTP Status Codes Reference

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH, PUT update) |
| 201 | Created (POST, PUT create) |
| 204 | No Content (DELETE - optional) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Testing Checklist

Before marking as complete, please verify:

- [ ] All endpoints return data in the standard `{ success, message, data, timestamp }` format
- [ ] Error responses follow the error format specification
- [ ] Admin endpoints properly check authentication and role
- [ ] Public endpoints are accessible without authentication
- [ ] Institute Info singleton pattern works correctly (only one record)
- [ ] Content Sections support multiple items per key
- [ ] Content Sections are filtered by `is_active` by default
- [ ] Sorting works correctly (by `order` field)
- [ ] All database queries use parameterized queries
- [ ] CORS is configured to allow credentials
- [ ] JSON fields (phone_numbers, social_media, content) are properly serialized/deserialized
- [ ] Timestamps are in ISO 8601 format
- [ ] Validation errors return array of messages
- [ ] 404 responses are returned for non-existent resources

---

## Frontend Integration Notes

### Request Examples

**GET Institute Info:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/institute-info', {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
// data.data contains the institute info object
```

**PUT Institute Info (Admin):**
```typescript
const response = await fetch('http://localhost:3000/api/v1/institute-info', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: "...",
    phone_numbers: [...],
    email: "...",
    social_media: { ... }
  })
});
```

**GET All Content Sections:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections', {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
// data.data contains grouped or flat array of sections
```

**GET Sections by Key:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections/hero', {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
// data.data contains array of sections for that key
```

---

## Questions or Clarifications

If you need clarification on any of these requirements, please contact the frontend team. The frontend is built with React + TypeScript and expects these exact response formats for proper integration.

