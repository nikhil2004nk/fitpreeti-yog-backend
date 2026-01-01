# CMS API Quick Reference for Backend Team

## 🎯 Quick Overview

Two modules to implement:
1. **Institute Info** - Singleton contact information
2. **Content Sections** - Flexible key-based content sections

---

## 📋 Endpoints Summary

### Institute Info (`/api/v1/institute-info`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/institute-info` | ❌ | - | Get contact info (public) |
| PUT | `/api/v1/institute-info` | ✅ | Admin | Create/Update contact info |

### Content Sections (`/api/v1/content-sections`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/content-sections` | ❌ | - | Get all active sections |
| GET | `/api/v1/content-sections/:key` | ❌ | - | Get sections by key |
| POST | `/api/v1/content-sections` | ✅ | Admin | Create section |
| PATCH | `/api/v1/content-sections/:id` | ✅ | Admin | Update section |
| DELETE | `/api/v1/content-sections/:id` | ✅ | Admin | Delete section (soft delete) |

---

## 🔑 Key Requirements

### Response Format (CRITICAL)
**ALL responses must follow this format:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error responses:**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Error message" | ["Error 1", "Error 2"],
  "path": "/api/v1/endpoint",
  "method": "POST",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Authentication
- Cookie-based JWT (same as existing endpoints)
- Admin endpoints: `@UseGuards(CookieJwtGuard, RolesGuard)` + `@Roles('admin')`
- Requests include `credentials: 'include'` (cookies automatically sent)

### Security
- ✅ **MUST use parameterized queries** (no string concatenation)
- ✅ Input validation with DTOs
- ✅ CORS configured for credentials

---

## 📊 Data Structures

### Institute Info Object
```typescript
{
  id: string (UUID)
  location: string
  phone_numbers: string[]  // JSON array
  email: string
  social_media: {          // JSON object
    instagram?: string | null
    facebook?: string | null
    youtube?: string | null
  }
  created_at: string (ISO 8601)
  updated_at: string (ISO 8601)
}
```

**Request Body (PUT):**
```json
{
  "location": "Full address string",
  "phone_numbers": ["+91 9876543210"],
  "email": "hello@fitpreeti.com",
  "social_media": {
    "instagram": "https://instagram.com/fitpreeti",
    "facebook": "https://facebook.com/fitpreeti",
    "youtube": "https://youtube.com/fitpreeti"
  }
}
```

### Content Section Object
```typescript
{
  id: string (UUID)
  section_key: string (LowCardinality)  // e.g., "hero", "announcements"
  content: object (JSON)                // Flexible structure
  order: number (UInt32)                // Sort order
  is_active: boolean
  created_at: string (ISO 8601)
  updated_at: string (ISO 8601)
}
```

**Request Body (POST):**
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Class",
    "message": "Check it out",
    "link": "/schedule",
    "priority": "high"
  },
  "order": 0,
  "is_active": true
}
```

---

## 🗄️ Database Notes

### Institute Info Table
- **Engine:** ReplacingMergeTree (singleton pattern)
- **Constraint:** Only one record should exist (enforce in business logic)
- **Fields:** id, location, phone_numbers (JSON), email, social_media (JSON), created_at, updated_at

### Content Sections Table
- **Engine:** MergeTree (allows multiple records)
- **Index:** section_key, order (for efficient queries)
- **Fields:** id, section_key (LowCardinality String), content (JSON String), order (UInt32), is_active (Boolean), created_at, updated_at

---

## ⚠️ Important Implementation Notes

### Institute Info (Singleton)
- ✅ Only ONE record should exist
- ✅ If record exists → UPDATE it
- ✅ If no record exists → CREATE it
- ✅ Use ReplacingMergeTree to prevent duplicates

### Content Sections
- ✅ Multiple items allowed per `section_key`
- ✅ Sort by `order` field (ascending)
- ✅ Filter by `is_active = true` by default
- ✅ GET all: Prefer grouping by `section_key`, or return flat array sorted by `section_key` then `order`
- ✅ DELETE: Soft delete (set `is_active = false`), do NOT hard delete

### GET All Content Sections Response Format

**Preferred (grouped):**
```json
{
  "data": {
    "hero": [{ /* sections */ }],
    "announcements": [{ /* sections */ }]
  }
}
```

**Alternative (flat array):**
```json
{
  "data": [
    { "section_key": "announcements", "order": 0, ... },
    { "section_key": "announcements", "order": 1, ... },
    { "section_key": "hero", "order": 0, ... }
  ]
}
```
*(Sorted by section_key, then order)*

---

## ✅ Pre-Launch Checklist

- [ ] All responses use standard format `{ success, message, data, timestamp }`
- [ ] Error responses include all required fields
- [ ] Admin endpoints check auth + role
- [ ] Public endpoints work without auth
- [ ] Institute Info singleton works (only one record)
- [ ] Content Sections support multiple items per key
- [ ] Filtering by `is_active` works correctly
- [ ] Sorting by `order` works correctly
- [ ] All queries use parameterized queries (security!)
- [ ] CORS allows credentials
- [ ] JSON fields properly serialized/deserialized
- [ ] Timestamps in ISO 8601 format
- [ ] DELETE uses soft delete (is_active = false)

---

## 📚 Full Documentation

See `CMS_API_SPECIFICATION.md` for complete details including:
- Detailed endpoint specifications
- Request/response examples
- Validation rules
- Error response formats
- Testing checklist

---

## 🆘 Quick Examples

### GET Institute Info
```
GET /api/v1/institute-info
Response: { success: true, data: { id, location, phone_numbers, email, social_media, ... } }
```

### PUT Institute Info
```
PUT /api/v1/institute-info
Body: { location, phone_numbers, email, social_media }
Response: { success: true, data: { ... } }
```

### GET All Sections
```
GET /api/v1/content-sections
Response: { success: true, data: { hero: [...], announcements: [...] } }
```

### GET Sections by Key
```
GET /api/v1/content-sections/hero
Response: { success: true, data: [{ id, section_key: "hero", content, order, ... }] }
```

### POST Create Section
```
POST /api/v1/content-sections
Body: { section_key, content, order, is_active }
Response: { success: true, data: { id, ... } }
```

### PATCH Update Section
```
PATCH /api/v1/content-sections/:id
Body: { content?, order?, is_active? }  // Partial update
Response: { success: true, data: { ... } }
```

### DELETE Section
```
DELETE /api/v1/content-sections/:id
Response: { success: true, message: "Deleted successfully" }
// Sets is_active = false (soft delete)
```

---

**Questions?** Refer to `CMS_API_SPECIFICATION.md` for complete details.

