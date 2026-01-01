# CMS System - UI Requirements Mapping

## Overview

This document maps the UI requirements to the backend API endpoints needed. The CMS system has two main use cases:

1. **Contact Information Page** - Display institute contact details (location, phone, email, social media)
2. **Dynamic Content Sections** - Display hero sections, announcements, and other content on various pages

---

## Use Case 1: Contact Information Page

### UI Location
- **Page:** Contact Page
- **URL:** `/contact` (or similar)

### UI Display Requirements

The contact page displays:

```
Contact Information
Our Location
[D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067]

WhatsApp / Call
[+91 9876543210 / +91 7039142314]

Email Us
[hello@fitpreeti.com]

Follow Us
[Instagram] [Facebook] [YouTube]
```

### Backend API Needed

**Endpoint:** `GET /api/v1/institute-info` (Public - No Auth Required)

**Response Format:**
```json
{
  "success": true,
  "message": "Institute info retrieved successfully",
  "data": {
    "id": "uuid",
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
  }
}
```

**Frontend Usage:**
- Fetch on page load
- Display `location`, `phone_numbers`, `email`, `social_media` links
- Handle case when no data exists yet (show placeholder or empty state)

### Admin Panel Requirement

**Endpoint:** `PUT /api/v1/institute-info` (Admin Only)

**Purpose:** Admin can update/create contact information

**Request Body:**
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

**Important Notes:**
- Only ONE record should exist (singleton pattern)
- If record exists, UPDATE it
- If no record exists, CREATE it

---

## Use Case 2: Dynamic Content Sections

### UI Locations
- **Home Page** - Hero section, announcements, featured content
- **Other Pages** - Various sections as needed

### UI Display Requirements

#### Hero Section (Home Page)
```
[Large Image/Video Background]
Welcome to FitPreeti Yoga
Transform your body and mind
[Book Now Button]
```

#### Announcements Section (Home Page or Multiple Pages)
```
📢 Announcement 1: New Morning Classes - [Learn More]
📢 Announcement 2: Holiday Special - 20% Off - [View Offers]
```

#### Other Sections (Flexible)
- Testimonials
- Features
- Services highlights
- Special offers
- etc.

### Backend API Needed

#### Get All Sections (Home Page)
**Endpoint:** `GET /api/v1/content-sections` (Public - No Auth Required)

**Purpose:** Fetch all active sections for display on home page or other pages

**Preferred Response Format (Grouped by Key):**
```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": {
    "hero": [
      {
        "id": "uuid",
        "section_key": "hero",
        "content": {
          "title": "Welcome to FitPreeti Yoga",
          "subtitle": "Transform your body and mind",
          "cta_button": {
            "text": "Book Now",
            "link": "/booking"
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
        "id": "uuid",
        "section_key": "announcements",
        "content": {
          "title": "New Morning Classes",
          "message": "Join us for our new 6 AM sessions",
          "link": "/schedule",
          "priority": "high"
        },
        "order": 0,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
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
  }
}
```

**Alternative Format (Flat Array - if grouping is complex):**
```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "section_key": "hero",
      "content": { /* ... */ },
      "order": 0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "section_key": "announcements",
      "content": { /* ... */ },
      "order": 0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
    // ... more sections sorted by section_key, then order
  ]
}
```

**Frontend Usage:**
- Fetch on page load
- Filter sections by `is_active: true` (or backend should filter)
- Group/display by `section_key`
- Sort multiple items by `order` field
- Render content based on section type

#### Get Sections by Specific Key
**Endpoint:** `GET /api/v1/content-sections/:key` (Public - No Auth Required)

**Purpose:** Fetch sections for a specific key (e.g., only "hero" or only "announcements")

**Example:** `GET /api/v1/content-sections/hero`

**Response Format:**
```json
{
  "success": true,
  "message": "Content sections retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "section_key": "hero",
      "content": {
        "title": "Welcome to FitPreeti Yoga",
        "subtitle": "Transform your body and mind",
        "cta_button": {
          "text": "Book Now",
          "link": "/booking"
        },
        "image_url": "https://example.com/hero.jpg"
      },
      "order": 0,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Frontend Usage:**
- Use when you only need a specific section type
- Returns array (even for single-item sections like "hero")
- Sorted by `order` field

### Admin Panel Requirements

#### Create New Section
**Endpoint:** `POST /api/v1/content-sections` (Admin Only)

**Purpose:** Admin creates a new content section

**Request Body Example (Hero):**
```json
{
  "section_key": "hero",
  "content": {
    "title": "Welcome to FitPreeti Yoga",
    "subtitle": "Transform your body and mind",
    "cta_button": {
      "text": "Book Now",
      "link": "/booking"
    },
    "image_url": "https://example.com/hero.jpg"
  },
  "order": 0,
  "is_active": true
}
```

**Request Body Example (Announcement):**
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Morning Classes",
    "message": "Join us for our new 6 AM sessions",
    "link": "/schedule",
    "priority": "high"
  },
  "order": 0,
  "is_active": true
}
```

#### Update Section
**Endpoint:** `PATCH /api/v1/content-sections/:id` (Admin Only)

**Purpose:** Admin updates an existing section

**Request Body (Partial Update):**
```json
{
  "content": {
    "title": "Updated Title",
    "subtitle": "Updated subtitle"
  },
  "is_active": false
}
```

#### Delete Section (Soft Delete)
**Endpoint:** `DELETE /api/v1/content-sections/:id` (Admin Only)

**Purpose:** Admin deactivates a section (soft delete - sets `is_active = false`)

**Important:** Do NOT hard delete. Set `is_active = false` instead.

---

## Content Structure Examples

### Hero Section Content Structure
```json
{
  "title": "Welcome to FitPreeti Yoga",
  "subtitle": "Transform your body and mind through ancient practices",
  "cta_button": {
    "text": "Book a Class",
    "link": "/booking"
  },
  "image_url": "https://example.com/hero-image.jpg",
  "background_color": "#f0f0f0"  // Optional
}
```

### Announcements Section Content Structure
```json
{
  "title": "New Morning Classes",
  "message": "Join us for our new 6 AM morning yoga sessions",
  "link": "/schedule",
  "priority": "high",  // "high" | "medium" | "low"
  "icon": "bell",  // Optional
  "expiry_date": "2024-12-31"  // Optional
}
```

### Flexible Content Structure
The `content` field is flexible JSON - backend should accept any valid JSON structure. Frontend will handle rendering based on `section_key` type.

---

## Key Requirements Summary

### Response Format (CRITICAL)
All responses must follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "timestamp": string (ISO 8601)
}
```

### Authentication
- Public endpoints (GET): No authentication required
- Admin endpoints (POST, PATCH, DELETE, PUT): Cookie-based JWT + Admin role required
- Use existing auth guards: `@UseGuards(CookieJwtGuard, RolesGuard)` + `@Roles('admin')`

### Data Structure
- **Institute Info:** Singleton (only one record)
- **Content Sections:** Multiple records per `section_key`, sorted by `order`
- **Active Filtering:** Only return `is_active: true` by default
- **Soft Delete:** DELETE sets `is_active = false`, does NOT hard delete

### Security
- ✅ Use parameterized queries (no string concatenation)
- ✅ Validate all inputs with DTOs
- ✅ CORS configured for credentials

---

## Frontend Integration Flow

### Contact Page
1. Component loads → Fetch `GET /api/v1/institute-info`
2. Display contact information
3. Handle empty state (no data yet)

### Home Page / Other Pages
1. Component loads → Fetch `GET /api/v1/content-sections`
2. Filter active sections (`is_active: true`)
3. Group by `section_key`
4. Sort by `order` within each group
5. Render each section based on its type

### Admin Panel
1. List sections → Fetch `GET /api/v1/content-sections`
2. Create section → `POST /api/v1/content-sections`
3. Update section → `PATCH /api/v1/content-sections/:id`
4. Delete section → `DELETE /api/v1/content-sections/:id` (soft delete)
5. Update contact info → `PUT /api/v1/institute-info`

---

## Complete API Documentation

For complete technical specifications, request/response examples, validation rules, and error handling, see:

1. **CMS_API_SPECIFICATION.md** - Complete detailed specification
2. **CMS_API_QUICK_REFERENCE.md** - Quick reference guide

---

## Questions for Backend Team

1. Will the GET all content-sections endpoint return grouped data (`{ hero: [...], announcements: [...] }`) or flat array?
2. Should inactive sections be accessible via query parameter? (e.g., `?include_inactive=true`)
3. What happens when no institute info exists? Return 404 or empty object?
4. Are there any validation rules for the `content` JSON field per section_key, or is it completely flexible?

---

**Ready for Implementation!** 🚀

