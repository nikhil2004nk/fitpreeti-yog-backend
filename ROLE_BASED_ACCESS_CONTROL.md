# Role-Based Access Control (RBAC) Documentation

## Overview
This document outlines the role-based access control implementation for the Fitpreeti Yoga API. The system supports three roles: **customer**, **trainer**, and **admin**.

## Role Definitions

### Customer
- Default role for regular users
- Can view services, trainers, and class schedules
- Can create and manage their own bookings
- Can view their own bookings

### Trainer
- Can perform all customer actions
- Can create, update, and delete class schedules
- Can update bookings (for their classes)
- Can view all bookings (for their classes)
- Can check trainer availability

### Admin
- Full system access
- Can manage users (view, update roles)
- Can manage services (create, update, delete)
- Can manage trainers (create, update, delete)
- Can manage all bookings
- Can manage all class schedules
- Can create admin users

## Endpoint Access Matrix

### Authentication (`/api/v1/auth`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| POST `/register` | ✅ | ✅ | ✅ |
| POST `/login` | ✅ | ✅ | ✅ |
| POST `/refresh` | ✅ | ✅ | ✅ |
| POST `/logout` | ✅ | ✅ | ✅ |
| GET `/profile` | ✅ | ✅ | ✅ |
| POST `/admin/create` | ❌ | ❌ | ✅ |

### Users (`/api/v1/users`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| GET `/` | ❌ | ❌ | ✅ |
| GET `/:phone` | ❌ | ❌ | ✅ |
| PATCH `/:phone/role` | ❌ | ❌ | ✅ |

### Services (`/api/v1/services`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| GET `/` | ✅ | ✅ | ✅ |
| GET `/popular` | ✅ | ✅ | ✅ |
| GET `/type/:type` | ✅ | ✅ | ✅ |
| GET `/:id` | ✅ | ✅ | ✅ |
| POST `/` | ❌ | ❌ | ✅ |
| PATCH `/:id` | ❌ | ❌ | ✅ |
| DELETE `/:id` | ❌ | ❌ | ✅ |

### Trainers (`/api/v1/trainers`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| GET `/` | ✅ | ✅ | ✅ |
| GET `/:id` | ✅ | ✅ | ✅ |
| POST `/` | ❌ | ❌ | ✅ |
| PUT `/:id` | ❌ | ❌ | ✅ |
| DELETE `/:id` | ❌ | ❌ | ✅ |

### Class Schedule (`/api/v1/class-schedule`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| GET `/` | ✅ | ✅ | ✅ |
| GET `/:id` | ✅ | ✅ | ✅ |
| GET `/trainer/:trainerId/availability` | ✅ | ✅ | ✅ |
| POST `/` | ❌ | ✅ | ✅ |
| PUT `/:id` | ❌ | ✅ | ✅ |
| DELETE `/:id` | ❌ | ✅ | ✅ |

### Bookings (`/api/v1/bookings`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| POST `/` | ✅ | ✅ | ✅ |
| GET `/` | ✅ (own only) | ✅ (own only) | ✅ (all) |
| GET `/:id` | ✅ (own only) | ✅ (own only) | ✅ (all) |
| GET `/available/:serviceId/:date` | ✅ | ✅ | ✅ |
| GET `/admin/all` | ❌ | ✅ | ✅ |
| PATCH `/:id` | ❌ | ✅ | ✅ |
| DELETE `/:id` | ✅ (own only) | ✅ (own only) | ✅ (all) |

### Health Check (`/api/v1/health`)
| Endpoint | Customer | Trainer | Admin |
|----------|----------|---------|-------|
| GET `/` | ✅ | ✅ | ✅ |

## Implementation Details

### Guards
- **CookieJwtGuard**: Validates JWT token from httpOnly cookies
- **RolesGuard**: Checks if user has required role(s)

### Decorators
- `@UseGuards(CookieJwtGuard)`: Requires authentication
- `@UseGuards(CookieJwtGuard, RolesGuard)`: Requires authentication and role check
- `@Roles('admin')`: Requires admin role
- `@Roles('admin', 'trainer')`: Requires admin or trainer role

### Notes
1. **Ownership Checks**: Some endpoints (like viewing/updating bookings) check if the user owns the resource. This is handled in the service layer.
2. **Trainer Access**: Trainers can manage class schedules and bookings, but ownership validation should be added in the service layer for production use.
3. **Default Role**: New users are assigned the 'customer' role by default.
4. **Role Updates**: Only admins can update user roles.

## Future Enhancements
- Add ownership validation for trainers updating their own class schedules
- Add trainer-specific endpoints (e.g., view my classes, view my bookings)
- Add role-based filtering in service layer for better security

