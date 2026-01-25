# Services API – Frontend Integration Guide

**Audience:** Frontend team  
**Last updated:** January 2025

This document describes **all service-related endpoints** and how to integrate them. Use it as the single source of truth for services and service-options.

---

## 1. Base URL & response format

- **Base URL:** `{API_BASE}/api/v1` (or your configured `API_PREFIX`; default `/api/v1`).
- **Auth:** Admin endpoints require **cookie-based JWT** (`access_token`). Public endpoints do not.
- **Success responses** are wrapped as:
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": { ... },
    "timestamp": "2025-01-25T12:00:00.000Z"
  }
  ```
  Use `response.data` for the actual payload. List endpoints return `data` as an array.
- **Errors:** Use the existing API error format (e.g. 400/401/404/409 with error details).
- **API docs:** Swagger at `GET /api` (when enabled).

---

## 2. Data model (services)

Each **service** has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique ID (PK). Use this for bookings, class schedules, etc. |
| `name` | `string` | Display name |
| `slug` | `string` | Unique URL-friendly identifier |
| `type` | `string` | Category: `online` \| `offline` \| `corporate` |
| `service_format` | `string \| null` | e.g. `"Private 1-to-1"`, `"Group Live Batch"`, `"Workshop / Retreat"` |
| `yoga_type` | `string \| null` | e.g. `"Hatha Yoga"`, `"Desk Yoga"` |
| `mode` | `string \| null` | `live` \| `recorded` \| `hybrid` \| `onsite` |
| `frequency` | `string \| null` | `single` \| `weekly` \| `monthly` |
| `audience` | `string \| null` | `individual` \| `group` \| `company` |
| `duration_minutes` | `number` | Session length (e.g. 30, 60, 90) |
| `price` | `number` | Price |
| `max_capacity` | `number` | Max participants |
| `description` | `string \| null` | Long description |
| `short_description` | `string \| null` | Brief summary |
| `image_url` | `string \| null` | Image URL |
| `video_url` | `string \| null` | Video URL |
| `requirements` | `string \| null` | Requirements |
| `benefits` | `string \| null` | Benefits |
| `metadata` | `object \| null` | Extra JSON |
| `is_active` | `boolean` | Whether the service is active |
| `created_at` | `string` | ISO timestamp |
| `updated_at` | `string` | ISO timestamp |

**Important:** Use the **exact** `type`, `service_format`, and `yoga_type` strings returned by the options API (see §3.1) when filtering or creating/updating services.

---

## 3. Public endpoints (no auth)

### 3.1 Get flow options (for dropdowns)

**Request:**
```
GET /api/v1/services/public/options
```

**Response (200):** `data` is an object:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "type": ["online", "offline", "corporate"],
    "service_format_by_type": {
      "online": ["Private 1-to-1", "Group Live Batch", "Pre-recorded Program", "Hybrid (Live + Recordings)"],
      "offline": ["Private at Studio", "Private at Home", "Group Studio Batch", "Workshop / Retreat"],
      "corporate": ["On-site Group Session", "Online Corporate Session", "Corporate Wellness Program (Monthly/Quarterly)", "Corporate Workshop / Event"]
    },
    "yoga_types_by_type": {
      "online": ["General Yoga", "Hatha Yoga", "Vinyasa Flow", "Power Yoga", "Ashtanga Yoga", "Meditation & Pranayama", "Prenatal Yoga", "Postnatal Yoga", "Weight Loss Yoga", "Therapeutic / Healing Yoga", "Beginner Yoga", "Senior Yoga"],
      "offline": ["Traditional Hatha Yoga", "Power Yoga", "Ashtanga Yoga", "Iyengar Yoga", "Weight Loss Yoga", "Spine & Back Care", "Knee / Joint Therapy", "Prenatal / Postnatal Yoga", "Kids Yoga", "Senior Citizen Yoga", "Meditation & Breathwork"],
      "corporate": ["Stress Management Yoga", "Desk Yoga", "Posture Correction Yoga", "Mental Wellness & Meditation", "Breathwork for Productivity", "Leadership Mindfulness Program", "Burnout Recovery Program"]
    },
    "mode": ["live", "recorded", "hybrid", "onsite"],
    "frequency": ["single", "weekly", "monthly"],
    "audience": ["individual", "group", "company"]
  },
  "timestamp": "..."
}
```

**Usage:**
- Call **once** on app/flow load (e.g. services browse or admin create screen).
- **Step 1 – Category:** Use `data.type` as options. User selects `type` (e.g. `online`).
- **Step 2 – Service type:** Use **only** `data.service_format_by_type[type]` (e.g. `data.service_format_by_type["online"]`). Do not show all formats at once.
- **Step 3 – Yoga type:** Use **only** `data.yoga_types_by_type[type]` (e.g. `data.yoga_types_by_type["online"]`). Do not show all yoga types at once.
- Use `data.mode`, `data.frequency`, `data.audience` if you have additional filters or form fields.

---

### 3.2 List services (filtered)

**Request:**
```
GET /api/v1/services/public
```

**Query parameters (all optional):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Category: `online`, `offline`, or `corporate` |
| `service_format` | string | Exact format label, e.g. `Private 1-to-1`, `Group Live Batch` |
| `yoga_type` | string | Exact yoga type, e.g. `Hatha Yoga`, `Desk Yoga` |
| `mode` | string | `live`, `recorded`, `hybrid`, or `onsite` |
| `frequency` | string | `single`, `weekly`, or `monthly` |
| `duration_minutes` | number | Session length, e.g. `60` |

**Example:**
```
GET /api/v1/services/public?type=online&service_format=Group%20Live%20Batch&yoga_type=Hatha%20Yoga&duration_minutes=60
```

**Response (200):** `data` is an array of services (see §2):

```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "name": "Online Hatha Yoga - Group Class",
      "slug": "online-hatha-group",
      "type": "online",
      "service_format": "Group Live Batch",
      "mode": "live",
      "frequency": "single",
      "audience": "group",
      "yoga_type": "Hatha Yoga",
      "duration_minutes": 60,
      "price": "500.00",
      "max_capacity": 20,
      "short_description": "...",
      "image_url": "...",
      "description": "...",
      "is_active": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "timestamp": "..."
}
```

Only **active** services are returned. Omit query params to list all active services.

---

## 4. Admin endpoints – Services (auth required)

All require **admin** role and **cookie JWT** (`access_token`).

### 4.1 List services

**Request:**
```
GET /api/v1/admin/services
```

**Query:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `activeOnly` | boolean | If `true`, return only active services. Optional. |

**Response (200):** `data` is an array of services (same shape as §3.2).

---

### 4.2 Get one service

**Request:**
```
GET /api/v1/admin/services/:id
```

**Response (200):** `data` is a single service object. **404** if not found.

---

### 4.3 Create service

**Request:**
```
POST /api/v1/admin/services
Content-Type: application/json
```

**Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Max 255 |
| `slug` | string | ✅ | Max 255, **unique** |
| `type` | string | ✅ | `online`, `offline`, or `corporate` |
| `duration_minutes` | number | ✅ | Min 1 |
| `price` | number | ✅ | |
| `service_format` | string | ❌ | Use exact label from options (e.g. `Group Live Batch`) |
| `yoga_type` | string | ❌ | Use exact label from options (e.g. `Hatha Yoga`) |
| `mode` | string | ❌ | `live` \| `recorded` \| `hybrid` \| `onsite` |
| `frequency` | string | ❌ | `single` \| `weekly` \| `monthly` |
| `audience` | string | ❌ | `individual` \| `group` \| `company` |
| `max_capacity` | number | ❌ | Min 1, default 1 |
| `description` | string | ❌ | |
| `short_description` | string | ❌ | Max 500 |
| `requirements` | string | ❌ | |
| `benefits` | string | ❌ | |
| `image_url` | string | ❌ | Max 500 |
| `video_url` | string | ❌ | Max 500 |
| `metadata` | object | ❌ | JSON |
| `is_active` | boolean | ❌ | Default `true` |

**Example:**
```json
{
  "name": "Online Hatha Yoga - Group Class",
  "slug": "online-hatha-group",
  "type": "online",
  "service_format": "Group Live Batch",
  "yoga_type": "Hatha Yoga",
  "mode": "live",
  "frequency": "single",
  "audience": "group",
  "duration_minutes": 60,
  "price": 500,
  "max_capacity": 20
}
```

**Response (201):** `data` is the created service. **409** if `slug` already exists.

---

### 4.4 Update service

**Request:**
```
PUT /api/v1/admin/services/:id
Content-Type: application/json
```

**Body (JSON):** Same fields as create, but **all optional**. Send only fields you want to update.

**Response (200):** `data` is the updated service. **404** if not found, **409** if `slug` is changed and already exists.

---

### 4.5 Deactivate service

**Request:**
```
DELETE /api/v1/admin/services/:id
```

**Response (200):** `data` is the deactivated service (with `is_active: false`). **404** if not found.

---

## 5. Admin endpoints – Service options (auth required)

Service options define **categories**, **service formats** (per category), and **yoga types** (per category). They drive `GET /services/public/options`. Defaults are **seeded**; admin can **add, edit, or delete** options.

All endpoints require **admin** role and **cookie JWT**.

### 5.1 List service options

**Request:**
```
GET /api/v1/admin/service-options
```

**Query:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | string | `category`, `service_format`, or `yoga_type` |
| `parent` | string | For `service_format` / `yoga_type`, the category (e.g. `online`). Omit for categories. |

**Examples:**
```
GET /api/v1/admin/service-options?kind=category
GET /api/v1/admin/service-options?kind=service_format&parent=online
GET /api/v1/admin/service-options?kind=yoga_type&parent=corporate
```

**Response (200):** `data` is an array of option objects:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "kind": "service_format",
      "value": "Group Live Batch",
      "parent": "online",
      "display_order": 2,
      "is_active": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "timestamp": "..."
}
```

---

### 5.2 Get one service option

**Request:**
```
GET /api/v1/admin/service-options/:id
```

**Response (200):** `data` is a single option. **404** if not found.

---

### 5.3 Create service option

**Request:**
```
POST /api/v1/admin/service-options
Content-Type: application/json
```

**Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | ✅ | `category` \| `service_format` \| `yoga_type` |
| `value` | string | ✅ | Max 255. Display label. |
| `parent` | string | ❌ | Omit or `""` for **category**. For **service_format** / **yoga_type**, use category (e.g. `online`, `offline`, `corporate`). |
| `display_order` | number | ❌ | Default `0` |
| `is_active` | boolean | ❌ | Default `true` |

**Examples:**
```json
{ "kind": "category", "value": "online" }
```
```json
{ "kind": "service_format", "value": "Custom Workshop", "parent": "offline", "display_order": 5 }
```
```json
{ "kind": "yoga_type", "value": "Custom Yoga", "parent": "online" }
```

**Response (201):** `data` is the created option. **409** if same `kind` + `parent` + `value` already exists.

---

### 5.4 Update service option

**Request:**
```
PUT /api/v1/admin/service-options/:id
Content-Type: application/json
```

**Body (JSON):** Same as create; all fields optional. Only send fields to update.

**Response (200):** `data` is the updated option. **404** if not found, **409** if updated combination conflicts.

---

### 5.5 Delete service option

**Request:**
```
DELETE /api/v1/admin/service-options/:id
```

**Response (204):** No body. **404** if not found.

---

## 6. UX flow (Category → Service type → Yoga type)

Use the same flow for **public browse** and **admin create**:

1. **Load options:** `GET /services/public/options` once.
2. **Step 1 – Category:** User selects one of `data.type` → store `type` (e.g. `online`).
3. **Step 2 – Service type:** Show only `data.service_format_by_type[type]`. User selects → store `service_format`.
4. **Step 3 – Yoga type:** Show only `data.yoga_types_by_type[type]`. User selects → store `yoga_type`.
5. **Step 4 – Act:**
   - **Public:** Call `GET /services/public?type=...&service_format=...&yoga_type=...` (add `mode`, `frequency`, `duration_minutes` if needed). Show results (offerings, price, CTA).
   - **Admin create:** Submit `POST /admin/services` with `name`, `slug`, `type`, `service_format`, `yoga_type`, and other required/optional fields. Use the **exact** strings from the options for `type`, `service_format`, `yoga_type`.

**Do not** show all formats or all yoga types at once; keep them **category-specific** using `service_format_by_type` and `yoga_types_by_type`.

---

## 7. Category → formats & yoga types (reference)

| Category | Service formats (step 2) | Yoga types (step 3) |
|----------|--------------------------|----------------------|
| **online** | Private 1-to-1, Group Live Batch, Pre-recorded Program, Hybrid (Live + Recordings) | General Yoga, Hatha Yoga, Vinyasa Flow, Power Yoga, Ashtanga Yoga, Meditation & Pranayama, Prenatal Yoga, Postnatal Yoga, Weight Loss Yoga, Therapeutic / Healing Yoga, Beginner Yoga, Senior Yoga |
| **offline** | Private at Studio, Private at Home, Group Studio Batch, Workshop / Retreat | Traditional Hatha Yoga, Power Yoga, Ashtanga Yoga, Iyengar Yoga, Weight Loss Yoga, Spine & Back Care, Knee / Joint Therapy, Prenatal / Postnatal Yoga, Kids Yoga, Senior Citizen Yoga, Meditation & Breathwork |
| **corporate** | On-site Group Session, Online Corporate Session, Corporate Wellness Program (Monthly/Quarterly), Corporate Workshop / Event | Stress Management Yoga, Desk Yoga, Posture Correction Yoga, Mental Wellness & Meditation, Breathwork for Productivity, Leadership Mindfulness Program, Burnout Recovery Program |

These are **seeded by default**. Admin can add more via **service-options** CRUD; `GET /services/public/options` always returns the current set (seed + custom).

---

## 8. Service ID usage

- **Service `id`** is a **unique integer** (primary key).
- Use **numeric** `id` everywhere:
  - **Bookings:** `POST /bookings` body includes `"service_id": 1`.
  - **Available slots:** `GET /bookings/available/:serviceId/:date` — `serviceId` is numeric (e.g. `1`, `2`).
  - **Class schedules:** `trainer_id` and `service_id` are numbers (trainer PK, service PK).
- Do **not** use UUIDs for services.

---

## 9. Enums / allowed values

Use these when sending `mode`, `frequency`, or `audience`:

| Field | Allowed values |
|-------|----------------|
| `mode` | `live`, `recorded`, `hybrid`, `onsite` |
| `frequency` | `single`, `weekly`, `monthly` |
| `audience` | `individual`, `group`, `company` |

---

## 10. Quick reference – All service-related endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/v1/services/public/options` | No | Flow config (dropdowns) |
| `GET` | `/api/v1/services/public` | No | List active services (filtered) |
| `GET` | `/api/v1/admin/services` | Admin | List services |
| `GET` | `/api/v1/admin/services/:id` | Admin | Get one service |
| `POST` | `/api/v1/admin/services` | Admin | Create service |
| `PUT` | `/api/v1/admin/services/:id` | Admin | Update service |
| `DELETE` | `/api/v1/admin/services/:id` | Admin | Deactivate service |
| `GET` | `/api/v1/admin/service-options` | Admin | List options (optional `?kind`, `?parent`) |
| `GET` | `/api/v1/admin/service-options/:id` | Admin | Get one option |
| `POST` | `/api/v1/admin/service-options` | Admin | Create option |
| `PUT` | `/api/v1/admin/service-options/:id` | Admin | Update option |
| `DELETE` | `/api/v1/admin/service-options/:id` | Admin | Delete option |

---

## 11. Integration checklist

- [ ] Use `{base}/api/v1` and read `response.data` for success payloads.
- [ ] Call `GET /services/public/options` once; use `service_format_by_type` and `yoga_types_by_type` for category-specific dropdowns.
- [ ] Implement flow: **Category** → **Service type** → **Yoga type**; do not show all formats/yoga types at once.
- [ ] **Public:** Filter services via `GET /services/public` with `type`, `service_format`, `yoga_type` (exact strings from options).
- [ ] **Admin create/update:** Use same options for dropdowns; send exact `type` / `service_format` / `yoga_type` in request body.
- [ ] Use **service `id` (number)** for bookings, available-slots, and class-schedule APIs.
- [ ] Admin endpoints: send **cookie JWT** (`access_token`); handle 401/403.

For more detail, see Swagger at `GET /api` when available.
