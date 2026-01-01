# Environment Variables Documentation

This document lists all required and optional environment variables for the Fitpreeti Yog Backend application.

## Required Environment Variables

These variables **must** be set for the application to run properly:

### 1. JWT_SECRET
- **Type**: String
- **Required**: ✅ Yes
- **Description**: Secret key used to sign and verify JWT tokens
- **Example**: `your-super-secret-jwt-key-here`
- **Security**: Use a strong, random string. Generate with: `openssl rand -base64 32`
- **Vercel**: Set in Project Settings → Environment Variables

### 2. CLICKHOUSE_URL
- **Type**: String
- **Required**: ✅ Yes
- **Description**: Full URL to your ClickHouse database instance
- **Example**: `https://your-clickhouse-instance.clickhouse.cloud:8443`
- **Format**: `https://host:port` or `https://username:password@host:port`
- **Vercel**: Set in Project Settings → Environment Variables

### 3. CLICKHOUSE_PASSWORD
- **Type**: String
- **Required**: ✅ Yes
- **Description**: Password for ClickHouse database authentication
- **Example**: `your-clickhouse-password`
- **Security**: Keep this secure, never commit to version control
- **Vercel**: Set in Project Settings → Environment Variables

## Optional Environment Variables (with defaults)

These variables have default values but can be customized:

### 4. NODE_ENV
- **Type**: Enum (`development` | `production` | `test`)
- **Required**: ❌ No (default: `development`)
- **Description**: Application environment
- **Example**: `production`
- **Vercel**: Usually set automatically, but can override

### 5. PORT
- **Type**: Number (1-65535)
- **Required**: ❌ No (default: `3000`)
- **Description**: Port number for the application (not used in Vercel serverless)
- **Example**: `3000`
- **Note**: Vercel handles port automatically, this is for local development

### 6. JWT_EXPIRES_IN
- **Type**: String
- **Required**: ❌ No (default: `1h`)
- **Description**: JWT token expiration time
- **Example**: `1h`, `24h`, `7d`
- **Format**: Time string (e.g., `15m`, `1h`, `7d`)

### 7. ACCESS_TOKEN_EXPIRES_IN
- **Type**: String
- **Required**: ❌ No (default: `15m`)
- **Description**: Access token expiration time (shorter than JWT)
- **Example**: `15m`, `30m`, `1h`
- **Format**: Time string

### 8. CLICKHOUSE_USERNAME
- **Type**: String
- **Required**: ❌ No (default: `default`)
- **Description**: Username for ClickHouse database
- **Example**: `default`
- **Vercel**: Set if different from default

### 9. CLICKHOUSE_DATABASE
- **Type**: String
- **Required**: ❌ No (default: `fitpreeti`)
- **Description**: ClickHouse database name
- **Example**: `fitpreeti`
- **Vercel**: Set if using a different database name

### 10. FRONTEND_URL
- **Type**: String
- **Required**: ❌ No (default: `http://localhost:3001`)
- **Description**: Frontend application URL for CORS configuration
- **Example**: `https://your-frontend.vercel.app`
- **Vercel**: **Important**: Set this to your actual frontend URL
- **Note**: Also allows all `.vercel.app` and `.vercel.dev` domains automatically

### 11. BCRYPT_SALT_ROUNDS
- **Type**: Number (1-20)
- **Required**: ❌ No (default: `12`)
- **Description**: Number of salt rounds for bcrypt password hashing
- **Example**: `12`
- **Security**: Higher values = more secure but slower (12 is recommended)

### 12. API_PREFIX
- **Type**: String
- **Required**: ❌ No (default: `/api/v1`)
- **Description**: Global API route prefix
- **Example**: `/api/v1`
- **Note**: Changing this requires updating all frontend API calls

### 13. ENABLE_SWAGGER
- **Type**: String (`true` | `false`)
- **Required**: ❌ No (default: disabled in production)
- **Description**: Enable Swagger API documentation in production
- **Example**: `true`
- **Note**: Swagger is automatically enabled in non-production environments

## Vercel Deployment Checklist

When deploying to Vercel, ensure these variables are set in **Project Settings → Environment Variables**:

### Critical (Required)
- [ ] `JWT_SECRET` - Generate a strong random string
- [ ] `CLICKHOUSE_URL` - Your ClickHouse instance URL
- [ ] `CLICKHOUSE_PASSWORD` - Your ClickHouse password
- [ ] `CLICKHOUSE_USERNAME` - Usually `default` (if not default)
- [ ] `CLICKHOUSE_DATABASE` - Usually `fitpreeti` (if different)

### Recommended
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` - Your frontend deployment URL
- [ ] `JWT_EXPIRES_IN=1h` (if different from default)
- [ ] `ACCESS_TOKEN_EXPIRES_IN=15m` (if different from default)
- [ ] `BCRYPT_SALT_ROUNDS=12` (if different from default)
- [ ] `API_PREFIX=/api/v1` (if different from default)

### Optional
- [ ] `ENABLE_SWAGGER=true` - If you want Swagger docs in production

## Environment Variable Validation

The application validates all environment variables on startup using `src/config/env.validation.ts`. If required variables are missing or invalid, the application will fail to start with a clear error message.

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Keep database credentials secure** - Only set in Vercel dashboard
4. **Use different secrets for different environments** - Don't reuse production secrets in development
5. **Rotate secrets regularly** - Especially if compromised
6. **Use Vercel's environment variable encryption** - Variables are encrypted at rest

## Generating Secure Secrets

### JWT Secret
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### ClickHouse Password
Use a strong password generator or:
```bash
# Linux/Mac
openssl rand -base64 24

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Testing Environment Variables

After setting environment variables in Vercel:
1. **Redeploy** your application (variables are only available after redeploy)
2. **Check health endpoint**: `GET /api/v1/health`
3. **Verify database connection** in health check response
4. **Test authentication** endpoints to ensure JWT_SECRET is working

## Troubleshooting

### Application fails to start
- Check Vercel deployment logs for validation errors
- Verify all required variables are set
- Check variable names match exactly (case-sensitive)

### Database connection fails
- Verify `CLICKHOUSE_URL` format is correct
- Check `CLICKHOUSE_USERNAME` and `CLICKHOUSE_PASSWORD`
- Ensure ClickHouse instance allows connections from Vercel IPs
- Check firewall rules

### Authentication not working
- Verify `JWT_SECRET` is set and not empty
- Check token expiration settings
- Ensure cookies are being set correctly (check CORS settings)

### CORS errors
- Verify `FRONTEND_URL` matches your frontend deployment URL exactly
- Check that frontend URL includes protocol (`https://`)
- Vercel preview URLs are automatically allowed

## Quick Reference

```bash
# Required
JWT_SECRET=your-secret-key
CLICKHOUSE_URL=https://your-clickhouse-url
CLICKHOUSE_PASSWORD=your-password

# Recommended
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
CLICKHOUSE_USERNAME=default
CLICKHOUSE_DATABASE=fitpreeti

# Optional
JWT_EXPIRES_IN=1h
ACCESS_TOKEN_EXPIRES_IN=15m
BCRYPT_SALT_ROUNDS=12
API_PREFIX=/api/v1
ENABLE_SWAGGER=false
```

---

**Last Updated**: 2026-01-01
**Version**: 1.0

