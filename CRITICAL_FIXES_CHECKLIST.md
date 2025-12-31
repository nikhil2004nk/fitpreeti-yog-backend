# Critical Fixes Checklist

## 🔴 IMMEDIATE FIXES (Do First)

### 1. SQL Injection Protection
- [ ] Replace all string concatenation SQL queries with parameterized queries
- [ ] Update `auth.service.ts` - all query methods
- [ ] Update `bookings.service.ts` - all query methods  
- [ ] Update `users.service.ts` - all query methods
- [ ] Update `services.service.ts` - all query methods
- [ ] Test all database queries after changes

**Priority:** CRITICAL - Fix immediately

---

### 2. Add Rate Limiting
```bash
npm install @nestjs/throttler
```

- [ ] Install `@nestjs/throttler` package
- [ ] Configure ThrottlerModule in `app.module.ts`
- [ ] Add `@Throttle()` decorator to auth endpoints
- [ ] Set limits: 5 requests per 15 minutes for login/register
- [ ] Test rate limiting works

**Priority:** CRITICAL - Fix immediately

---

### 3. Add Security Headers
```bash
npm install helmet
```

- [ ] Install `helmet` package
- [ ] Add `app.use(helmet())` in `main.ts`
- [ ] Configure CSP if needed
- [ ] Test headers are present

**Priority:** CRITICAL - Fix immediately

---

### 4. Fix Logout Bug
- [ ] Fix `auth.controller.ts:113` - pass refresh token instead of phone
- [ ] Extract refresh token from cookies in logout method
- [ ] Extract access token from cookies in logout method
- [ ] Update `auth.service.logout()` to handle both tokens correctly
- [ ] Test logout invalidates tokens properly

**Current Bug:**
```typescript
// ❌ WRONG - auth.controller.ts:113
await this.authService.logout(user.phone);

// ✅ SHOULD BE:
const refreshToken = req.cookies?.['refresh_token'];
const accessToken = req.cookies?.['access_token'];
await this.authService.logout(refreshToken, accessToken);
```

**Priority:** CRITICAL - Fix immediately

---

### 5. Create .env.example File
- [ ] Create `.env.example` file
- [ ] List all required environment variables
- [ ] Add comments explaining each variable
- [ ] Include example values (without secrets)
- [ ] Update README with setup instructions

**Required Variables:**
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
ACCESS_TOKEN_EXPIRES_IN=15m
CLICKHOUSE_URL=https://your-clickhouse-url
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=your-password
CLICKHOUSE_DATABASE=fitpreeti
FRONTEND_URL=http://localhost:3001
```

**Priority:** CRITICAL - Fix immediately

---

### 6. Add Environment Variable Validation
- [ ] Install `@nestjs/config` (already installed)
- [ ] Create validation schema in `app.module.ts`
- [ ] Validate all required variables on startup
- [ ] Fail fast if critical variables missing
- [ ] Test with missing variables

**Priority:** CRITICAL - Fix immediately

---

### 7. Improve PIN Validation
- [ ] Update `register.dto.ts` - change `@MinLength(4)` to `@MinLength(6)`
- [ ] Add `@MaxLength(8)` to PIN field
- [ ] Update `auth.service.ts:123` validation
- [ ] Add PIN format validation (digits only)
- [ ] Update error messages

**Priority:** HIGH - Fix this week

---

### 8. Add Input Sanitization
```bash
npm install sanitize-html
npm install @types/sanitize-html --save-dev
```

- [ ] Install sanitization library
- [ ] Create sanitization utility
- [ ] Add sanitization to all DTOs
- [ ] Sanitize user inputs before storage
- [ ] Test XSS prevention

**Priority:** HIGH - Fix this week

---

## 🟠 HIGH PRIORITY FIXES (This Week)

### 9. Standardize API Routes
- [ ] Add global prefix `/api/v1` in `main.ts`
- [ ] Update all controllers to use consistent routes
- [ ] Update API documentation
- [ ] Update frontend API calls
- [ ] Test all endpoints

---

### 10. Fix Error Information Disclosure
- [ ] Update `http-exception.filter.ts`
- [ ] Only log stack traces in development
- [ ] Sanitize error messages in production
- [ ] Use structured logging
- [ ] Test error responses

---

### 11. Add Request Logging
- [ ] Create logging middleware
- [ ] Log all requests with request ID
- [ ] Log response times
- [ ] Add correlation IDs
- [ ] Test logging works

---

### 12. Improve Type Safety
- [ ] Create `RequestUser` interface
- [ ] Replace all `req.user as any` with proper typing
- [ ] Remove `any` types from codebase
- [ ] Enable strict TypeScript mode gradually
- [ ] Fix type errors

---

## 🟡 MEDIUM PRIORITY (This Month)

### 13. Write Unit Tests
- [ ] Write tests for `auth.service.ts`
- [ ] Write tests for `bookings.service.ts`
- [ ] Write tests for `services.service.ts`
- [ ] Target 80% code coverage
- [ ] Set up coverage reporting

---

### 14. Add Database Health Checks
- [ ] Update `health.controller.ts`
- [ ] Add ClickHouse connectivity check
- [ ] Add dependency health checks
- [ ] Implement readiness probe
- [ ] Test health endpoints

---

### 15. Add Pagination
- [ ] Create pagination DTO
- [ ] Add pagination to list endpoints
- [ ] Update services to support pagination
- [ ] Add pagination metadata to responses
- [ ] Test pagination works

---

## 📋 TESTING CHECKLIST

After each fix:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security testing done
- [ ] Performance impact assessed

---

## 🔍 CODE REVIEW CHECKLIST

Before committing:
- [ ] No SQL injection vulnerabilities
- [ ] No `any` types
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security headers present
- [ ] Rate limiting configured
- [ ] Tests written and passing
- [ ] Documentation updated

---

## 📝 NOTES

- Fix critical issues first (SQL injection, rate limiting, security headers)
- Test thoroughly after each fix
- Don't deploy to production until critical issues are resolved
- Keep security fixes as separate commits for easier tracking

