# Fitpreeti Yoga Institute - API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
</p>

## Table of Contents
1. [Project Setup](#project-setup)
2. [Development](#development)
3. [API Documentation](#api-documentation)
   - [Authentication](#authentication)
   - [Services](#services)
   - [Class Schedule](#class-schedule)
   - [Trainers](#trainers)
   - [Bookings](#bookings)
   - [Content Management](#content-management)
   - [User Management](#user-management)
   - [Testimonials](#testimonials)
   - [Media Upload](#media-upload)
4. [Deployment](#deployment)
5. [Testing](#testing)
6. [Security](#security)
7. [Contributing](#contributing)
8. [License](#license)

## Project Setup

```bash
# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env
# Edit .env with your configuration
```

## Development

```bash
# Start in development mode with hot-reload
$ npm run start:dev

# Build the project
$ npm run build

# Run the production build
$ npm run start:prod
```

## API Documentation

### Authentication

#### Current Implementation
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - Logout
- `POST /auth/admin/create` - Create admin (admin only)

#### Recommended Changes
- Add role-based access control
- Implement password reset functionality
- Add email verification

### Services

#### Current Implementation
- `GET /services` - Get all services
- `GET /services/:id` - Get service by ID
- `GET /services/popular` - Get popular services
- `GET /services/type/:type` - Get services by type
- `POST /services` - Create service (admin)
- `PATCH /services/:id` - Update service (admin)
- `DELETE /services/:id` - Delete service (admin)

### Class Schedule

#### Endpoints
- `GET /api/schedule` - Get all class schedules
- `POST /api/schedule` - Add new class schedule (admin)
- `PUT /api/schedule/:id` - Update class schedule (admin)
- `DELETE /api/schedule/:id` - Delete class schedule (admin)

### Trainers

#### Endpoints
- `GET /api/trainers` - Get all trainers
- `POST /api/trainers` - Add new trainer (admin)
- `PUT /api/trainers/:id` - Update trainer info (admin)
- `DELETE /api/trainers/:id` - Remove trainer (admin)

### Bookings

#### Current Implementation
- `POST /bookings` - Create booking
- `GET /bookings` - Get user's bookings
- `GET /bookings/:id` - Get booking by ID
- `GET /bookings/available/:serviceId/:date` - Get available slots
- `PATCH /bookings/:id` - Update booking (admin)
- `GET /admin/bookings` - Get all bookings (admin)

### Content Management

#### Endpoints
- `GET /api/content/home` - Get home page content
- `PUT /api/content/home` - Update home page content (admin)
- `GET /api/content/about` - Get about page content
- `PUT /api/content/about` - Update about page content (admin)

### User Management

#### Current Implementation
- `GET /admin/users` - Get all users (admin)
- `GET /admin/users/:id` - Get user by ID (admin)
- `PATCH /admin/users/:id` - Update user (admin)
- `DELETE /admin/users/:id` - Delete user (admin)

### Testimonials

#### Endpoints
- `GET /api/testimonials` - Get all approved testimonials
- `POST /api/testimonials` - Submit new testimonial
- `PUT /api/testimonials/:id` - Update testimonial (admin)
- `DELETE /api/testimonials/:id` - Delete testimonial (admin)
- `PUT /api/testimonials/:id/approve` - Approve/publish testimonial (admin)

### Media Upload

#### Endpoints
- `POST /api/upload` - Upload images/media (admin)
- `DELETE /api/upload/:filename` - Delete uploaded file (admin)

## Deployment

```bash
# Production build
$ npm run build

# Run migrations (if any)
$ npm run typeorm migration:run

# Start production server
$ npm run start:prod
```

## Testing

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## Security

- All API endpoints are protected with JWT authentication
- Role-based access control (RBAC) for admin endpoints
- Input validation for all endpoints
- Rate limiting enabled
- CORS configured for production
- Helmet middleware for security headers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is [MIT licensed](LICENSE).
