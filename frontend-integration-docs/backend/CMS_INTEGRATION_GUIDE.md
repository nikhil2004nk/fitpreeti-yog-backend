# CMS System - Frontend Integration Guide

## ✅ Implementation Status

**All requirements have been successfully implemented and are ready for frontend integration!**

This guide provides everything the frontend team needs to integrate with the CMS (Content Management System) backend APIs.

---

## 📋 Quick Start Checklist

- [x] Institute Info API - ✅ Implemented
- [x] Content Sections API - ✅ Implemented
- [x] Authentication & Authorization - ✅ Implemented
- [x] Response Format Standardization - ✅ Implemented
- [x] Error Handling - ✅ Implemented
- [x] Swagger Documentation - ✅ Available at `/api`

---

## 🌐 API Base Configuration

### Base URL
```
http://localhost:3000/api/v1
```

**Production:** Replace `localhost:3000` with your production API URL.

### Authentication
- **Public Endpoints:** No authentication required
- **Admin Endpoints:** Cookie-based JWT authentication required
- **Credentials:** Always include `credentials: 'include'` in fetch requests
- **Headers:** `Content-Type: application/json`

### Response Format

All responses follow this standard format:

**Success Response:**
```typescript
{
  success: true,
  message: string,
  data: T,
  timestamp: string (ISO 8601)
}
```

**Error Response:**
```typescript
{
  success: false,
  statusCode: number,
  error: string,
  message: string | string[],
  path: string,
  method: string,
  timestamp: string (ISO 8601)
}
```

---

## 📞 Module 1: Institute Info API

### Purpose
Manage institute contact information (singleton - only one record exists).

### Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/institute-info` | ❌ | - | Get contact information |
| PUT | `/api/v1/institute-info` | ✅ | Admin | Create/Update contact information |

---

### 1. GET Institute Info

**Endpoint:** `GET /api/v1/institute-info`

**Authentication:** Not required (Public)

**Response:**
```typescript
{
  success: true,
  message: "Institute info retrieved successfully",
  data: {
    id: string (UUID),
    location: string,
    phone_numbers: string[],
    email: string,
    social_media: {
      instagram?: string | null,
      facebook?: string | null,
      youtube?: string | null,
      whatsapp?: string | null
    },
    created_at: string (ISO 8601),
    updated_at: string (ISO 8601)
  },
  timestamp: string
}
```

**Example Usage:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/institute-info', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();

if (result.success) {
  const instituteInfo = result.data;
  console.log('Location:', instituteInfo.location);
  console.log('Phone:', instituteInfo.phone_numbers);
  console.log('Email:', instituteInfo.email);
  console.log('Social Media:', instituteInfo.social_media);
} else {
  // Handle error (404 if not found)
  console.error('Error:', result.message);
}
```

**Error Cases:**
- `404 Not Found` - No institute info record exists yet
- Handle gracefully by showing placeholder/empty state

---

### 2. PUT Institute Info

**Endpoint:** `PUT /api/v1/institute-info`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  location: string,              // Required
  phone_numbers: string[],       // Required, at least one item
  email: string,                 // Required, valid email format
  social_media?: {               // Optional
    instagram?: string,          // Valid URL
    facebook?: string,           // Valid URL
    youtube?: string,            // Valid URL
    whatsapp?: string            // Valid URL
  }
}
```

**Example Request:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/institute-info', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location: "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
    phone_numbers: ["+91 9876543210", "+91 7039142314"],
    email: "hello@fitpreeti.com",
    social_media: {
      instagram: "https://www.instagram.com/fitpreeti_fitness_dance_studio/",
      facebook: "https://www.facebook.com/fitpreeti4603/",
      youtube: "https://youtube.com/@fitpreeti",
      whatsapp: "https://wa.me/917039142314"
    }
  })
});

const result = await response.json();

if (result.success) {
  console.log('Institute info updated:', result.data);
} else {
  // Handle validation errors
  console.error('Error:', result.message);
}
```

**Response:** Same structure as GET endpoint

**Error Cases:**
- `400 Bad Request` - Validation errors (check `result.message` array)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin user

---

## 🎨 Module 2: Content Sections API

### Purpose
Manage dynamic content sections (hero, announcements, etc.) with flexible JSON content structure.

### Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/content-sections` | ❌ | - | Get all sections (grouped or flat) |
| GET | `/api/v1/content-sections/:key` | ❌ | - | Get sections by key |
| POST | `/api/v1/content-sections` | ✅ | Admin | Create new section |
| PATCH | `/api/v1/content-sections/:id` | ✅ | Admin | Update section |
| DELETE | `/api/v1/content-sections/:id` | ✅ | Admin | Delete (deactivate) section |

---

### 1. GET All Content Sections

**Endpoint:** `GET /api/v1/content-sections`

**Query Parameters:**
- `include_inactive` (optional, boolean): Include inactive sections (default: `false`)
- `grouped` (optional, boolean): Return grouped by section_key (default: `true`)

**Authentication:** Not required (Public)

**Response (Grouped - Default):**
```typescript
{
  success: true,
  message: "Content sections retrieved successfully",
  data: {
    "hero": [
      {
        id: string (UUID),
        section_key: "hero",
        content: {
          // Flexible JSON structure - varies by section type
          title?: string,
          subtitle?: string,
          cta_button?: {
            text: string,
            link: string,
            action?: "navigate" | "external" | "scroll"
          },
          image_url?: string,
          background_color?: string,
          // ... any other fields needed
        },
        order: number,
        is_active: boolean,
        created_at: string (ISO 8601),
        updated_at: string (ISO 8601)
      }
    ],
    "announcements": [
      {
        id: string (UUID),
        section_key: "announcements",
        content: {
          title: string,
          message: string,
          link?: string,
          link_text?: string,
          priority?: "high" | "medium" | "low",
          icon?: string,
          bg_color?: string,
          text_color?: string,
          expiry_date?: string
        },
        order: number,
        is_active: boolean,
        created_at: string,
        updated_at: string
      }
      // ... more announcements
    ]
    // ... more section types
  },
  timestamp: string
}
```

**Response (Flat Array - when `grouped=false`):**
```typescript
{
  success: true,
  message: "Content sections retrieved successfully",
  data: [
    {
      id: string,
      section_key: string,
      content: object,
      order: number,
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
    // ... more sections, sorted by section_key, then order
  ],
  timestamp: string
}
```

**Example Usage (Grouped):**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections?grouped=true', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();

if (result.success) {
  const sections = result.data;
  
  // Access hero section
  const heroSections = sections.hero || [];
  if (heroSections.length > 0) {
    const hero = heroSections[0]; // Usually only one hero section
    console.log('Hero Title:', hero.content.title);
    console.log('Hero Subtitle:', hero.content.subtitle);
  }
  
  // Access announcements
  const announcements = sections.announcements || [];
  announcements.forEach(announcement => {
    console.log('Announcement:', announcement.content.title);
  });
}
```

**Example Usage (Flat):**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections?grouped=false', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();

if (result.success) {
  const sections = result.data; // Array of sections
  sections.forEach(section => {
    console.log(`Section ${section.section_key}:`, section.content);
  });
}
```

---

### 2. GET Content Sections by Key

**Endpoint:** `GET /api/v1/content-sections/:key`

**Path Parameter:**
- `key` (required, string): Section key (e.g., "hero", "announcements", "cta_home")

**Authentication:** Not required (Public)

**Response:**
```typescript
{
  success: true,
  message: "Content sections retrieved successfully",
  data: [
    {
      id: string (UUID),
      section_key: string,
      content: object, // Flexible JSON structure
      order: number,
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
    // ... more sections for this key, sorted by order
  ],
  timestamp: string
}
```

**Example Usage:**
```typescript
const fetchHeroSection = async () => {
  const response = await fetch('http://localhost:3000/api/v1/content-sections/hero', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (result.success && result.data.length > 0) {
    const hero = result.data[0]; // Usually only one hero section
    return hero.content;
  }
  
  return null; // No hero section found
};

const fetchAnnouncements = async () => {
  const response = await fetch('http://localhost:3000/api/v1/content-sections/announcements', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (result.success) {
    return result.data; // Array of announcements
  }
  
  return []; // No announcements found
};
```

**Error Cases:**
- Returns empty array `[]` if no sections found for the key
- Handle gracefully in UI

---

### 3. POST Create Content Section (Admin Only)

**Endpoint:** `POST /api/v1/content-sections`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  section_key: string,           // Required, e.g., "hero", "announcements"
  content: object,               // Required, flexible JSON structure
  order: number,                 // Required, >= 0, for sorting
  is_active?: boolean            // Optional, default: true
}
```

**Example: Hero Section**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    section_key: "hero",
    content: {
      title: "Welcome to FitPreeti Yog Institute",
      subtitle: "Yoga for calm. Zumba for energy. Dance for joy. Fitness for transformation.",
      cta_primary: {
        text: "Book Your Class",
        link: "/booking",
        action: "navigate"
      },
      cta_secondary: {
        text: "Explore Classes",
        link: "/services",
        action: "navigate"
      },
      background_image: "https://example.com/hero-bg.jpg",
      background_color: "#000000"
    },
    order: 0,
    is_active: true
  })
});

const result = await response.json();
```

**Example: Announcement**
```typescript
const response = await fetch('http://localhost:3000/api/v1/content-sections', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    section_key: "announcements",
    content: {
      title: "New Morning Classes Available",
      message: "Join us for our new 6 AM yoga sessions. Limited spots available!",
      link: "/schedule",
      link_text: "View Schedule",
      priority: "high",
      icon: "bell",
      bg_color: "#dc2626",
      text_color: "#ffffff",
      expiry_date: "2024-12-31"
    },
    order: 0,
    is_active: true
  })
});

const result = await response.json();
```

**Response:** Created section object (same structure as GET response)

**Error Cases:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin user

---

### 4. PATCH Update Content Section (Admin Only)

**Endpoint:** `PATCH /api/v1/content-sections/:id`

**Path Parameter:**
- `id` (required, UUID): Section ID

**Authentication:** Required (Admin only)

**Request Body:** All fields are optional (partial update)
```typescript
{
  section_key?: string,
  content?: object,
  order?: number,
  is_active?: boolean
}
```

**Example:**
```typescript
const sectionId = "123e4567-e89b-12d3-a456-426614174000";

const response = await fetch(`http://localhost:3000/api/v1/content-sections/${sectionId}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: {
      title: "Updated Title",
      subtitle: "Updated subtitle"
    },
    is_active: false
  })
});

const result = await response.json();
```

**Response:** Updated section object

**Error Cases:**
- `404 Not Found` - Section ID doesn't exist
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin user

---

### 5. DELETE Content Section (Admin Only)

**Endpoint:** `DELETE /api/v1/content-sections/:id`

**Path Parameter:**
- `id` (required, UUID): Section ID

**Authentication:** Required (Admin only)

**Request Body:** None

**Example:**
```typescript
const sectionId = "123e4567-e89b-12d3-a456-426614174000";

const response = await fetch(`http://localhost:3000/api/v1/content-sections/${sectionId}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();

if (result.success) {
  console.log('Section deleted (deactivated):', result.data);
}
```

**Response:**
```typescript
{
  success: true,
  message: "Content section deleted successfully",
  data: {
    id: string,
    is_active: false
  },
  timestamp: string
}
```

**Note:** This is a **soft delete** - the section is deactivated (`is_active = false`) but not permanently removed from the database.

**Error Cases:**
- `404 Not Found` - Section ID doesn't exist
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin user

---

## 📝 Content Structure Examples

### Hero Section
```json
{
  "section_key": "hero",
  "content": {
    "title": "Welcome to FitPreeti Yog Institute",
    "subtitle": "Yoga for calm. Zumba for energy. Dance for joy. Fitness for transformation.",
    "cta_primary": {
      "text": "Book Your Class",
      "link": "/booking",
      "action": "navigate"
    },
    "cta_secondary": {
      "text": "Explore Classes",
      "link": "/services",
      "action": "navigate"
    },
    "background_image": "https://example.com/hero-bg.jpg",
    "background_color": "#000000"
  },
  "order": 0,
  "is_active": true
}
```

### Announcements
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Morning Classes Available",
    "message": "Join us for our new 6 AM yoga sessions. Limited spots available!",
    "link": "/schedule",
    "link_text": "View Schedule",
    "priority": "high",
    "icon": "bell",
    "bg_color": "#dc2626",
    "text_color": "#ffffff",
    "expiry_date": "2024-12-31"
  },
  "order": 0,
  "is_active": true
}
```

### CTA Section
```json
{
  "section_key": "cta_home",
  "content": {
    "title": "Begin Your Journey Towards a Healthier & Balanced Life",
    "subtitle": "At FitPreeti Yog Institute, we blend traditional yoga with modern fitness techniques...",
    "cta_primary": {
      "text": "Book a Free Trial Class",
      "link": "/booking",
      "action": "navigate"
    },
    "cta_secondary": {
      "text": "Talk to Us on WhatsApp",
      "link": "https://wa.me/917039142314",
      "action": "external"
    },
    "social_proof": {
      "text": "Trusted by 500+ Happy Students",
      "show_avatars": true
    },
    "background_color": "#dc2626"
  },
  "order": 0,
  "is_active": true
}
```

---

## 🔧 TypeScript Type Definitions

### Institute Info
```typescript
interface InstituteInfo {
  id: string;
  location: string;
  phone_numbers: string[];
  email: string;
  social_media: {
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
  };
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
```

### Content Sections
```typescript
interface ContentSection {
  id: string;
  section_key: string;
  content: Record<string, any>; // Flexible JSON structure
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroContent {
  title: string;
  subtitle: string;
  cta_primary?: {
    text: string;
    link: string;
    action?: "navigate" | "external" | "scroll";
  };
  cta_secondary?: {
    text: string;
    link: string;
    action?: "navigate" | "external" | "scroll";
  };
  background_image?: string;
  background_color?: string;
}

interface AnnouncementContent {
  title: string;
  message: string;
  link?: string;
  link_text?: string;
  priority?: "high" | "medium" | "low";
  icon?: string;
  bg_color?: string;
  text_color?: string;
  expiry_date?: string;
}
```

---

## 🎯 Frontend Integration Patterns

### React Hook Example

```typescript
// hooks/useInstituteInfo.ts
import { useState, useEffect } from 'react';

interface InstituteInfo {
  id: string;
  location: string;
  phone_numbers: string[];
  email: string;
  social_media: {
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
  };
  created_at: string;
  updated_at: string;
}

export const useInstituteInfo = () => {
  const [data, setData] = useState<InstituteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/v1/institute-info', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch institute info');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchInstituteInfo();
  }, []);

  return { data, loading, error };
};
```

```typescript
// hooks/useContentSections.ts
import { useState, useEffect } from 'react';
import { ContentSection } from '../types';

export const useContentSections = (key?: string) => {
  const [data, setData] = useState<ContentSection[] | Record<string, ContentSection[]>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const url = key 
          ? `http://localhost:3000/api/v1/content-sections/${key}`
          : 'http://localhost:3000/api/v1/content-sections?grouped=true';
        
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch content sections');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [key]);

  return { data, loading, error };
};
```

---

## 🚨 Error Handling

### Standard Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}
```

### Error Handling Example
```typescript
const handleApiError = (error: ApiErrorResponse) => {
  if (error.statusCode === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.statusCode === 403) {
    // Show forbidden message
    alert('You do not have permission to perform this action');
  } else if (error.statusCode === 404) {
    // Show not found message
    console.log('Resource not found');
  } else if (error.statusCode === 400) {
    // Validation errors
    const messages = Array.isArray(error.message) 
      ? error.message.join(', ')
      : error.message;
    alert(`Validation error: ${messages}`);
  } else {
    // Generic error
    alert('An error occurred. Please try again.');
  }
};
```

---

## 📚 Additional Resources

1. **Swagger Documentation:** Available at `http://localhost:3000/api`
   - Interactive API documentation
   - Test endpoints directly
   - View request/response schemas

2. **Related Documentation:**
   - `CMS_API_SPECIFICATION.md` - Complete API specification
   - `CMS_API_QUICK_REFERENCE.md` - Quick reference guide
   - `CMS_UI_REQUIREMENTS.md` - UI requirements mapping
   - `CMS_SECTIONS_REQUIREMENTS.md` - Complete section requirements

---

## ✅ Testing Checklist

Before going to production, verify:

- [ ] All public endpoints work without authentication
- [ ] Admin endpoints require authentication and admin role
- [ ] Response format matches expected structure
- [ ] Error handling works correctly
- [ ] Empty states are handled (404 for institute info, empty arrays for sections)
- [ ] Content sections can be created, updated, and deleted (soft delete)
- [ ] Grouped and flat array responses work as expected
- [ ] CORS is configured correctly
- [ ] Cookies are sent/received correctly

---

## 🆘 Support

If you encounter any issues or need clarification:

1. Check the Swagger documentation at `/api`
2. Review the error response for details
3. Check browser console for network errors
4. Verify authentication cookies are being sent
5. Contact the backend team with:
   - Endpoint being called
   - Request body (if any)
   - Response status and body
   - Browser console errors

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Integration  
**Version:** 1.0.0

