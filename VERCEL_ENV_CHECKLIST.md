# Vercel Environment Variables Checklist

## ✅ Variables You Currently Have

1. ✅ **CLICKHOUSE_PASSWORD** - Database password
2. ✅ **CLICKHOUSE_DATABASE** - Database name
3. ✅ **FRONTEND_URL** - Frontend URL for CORS
4. ✅ **BCRYPT_SALT_ROUNDS** - Password hashing rounds
5. ✅ **API_PREFIX** - API route prefix

## ❌ CRITICAL - Missing Required Variables

These **MUST** be added for the application to work properly:

### 1. JWT_SECRET ⚠️ **REQUIRED**
- **Why**: Used to sign and verify authentication tokens
- **Impact**: Authentication will fail without this
- **How to generate**:
  ```bash
  # Windows PowerShell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
  
  # Or use online generator: https://generate-secret.vercel.app/32
  ```
- **Example value**: `aB3xK9mP2qR7vT5wY8zN1cF4hJ6gL0sD9eA2bC5dE8fG1hI3jK6lM9nO0pQ`
- **Note**: Make it long and random (at least 32 characters)

### 2. CLICKHOUSE_URL ⚠️ **REQUIRED**
- **Why**: Connection URL to your ClickHouse database
- **Impact**: Database connection will fail without this
- **Format**: `https://host:port` or `https://username:password@host:port`
- **Example**: 
  - `https://your-instance.clickhouse.cloud:8443`
  - `https://default:password@your-instance.clickhouse.cloud:8443`
- **Where to find**: Check your ClickHouse cloud dashboard or hosting provider

## ⚠️ RECOMMENDED - Should Add

### 3. CLICKHOUSE_USERNAME
- **Why**: Database username (if not using 'default')
- **Default**: `default`
- **When to set**: If your ClickHouse instance uses a different username
- **Example**: `default` or `admin`

### 4. NODE_ENV
- **Why**: Sets the application environment
- **Recommended value**: `production`
- **Note**: Vercel may set this automatically, but it's good to be explicit

## 📋 Optional Variables (Have Defaults)

These have defaults but can be customized:

- **JWT_EXPIRES_IN** (default: `1h`) - JWT token expiration
- **ACCESS_TOKEN_EXPIRES_IN** (default: `15m`) - Access token expiration
- **ENABLE_SWAGGER** (default: disabled in production) - Enable API docs

## 🚀 Quick Setup Guide

### Step 1: Add JWT_SECRET

1. Click **"Create new"** in Vercel environment variables
2. **Key**: `JWT_SECRET`
3. **Value**: Generate a secure random string (see above)
4. **Environments**: Select "All Environments"
5. **Sensitive**: ✅ Enable (recommended)
6. Click **"Save"**

### Step 2: Add CLICKHOUSE_URL

1. Click **"Create new"** in Vercel environment variables
2. **Key**: `CLICKHOUSE_URL`
3. **Value**: Your ClickHouse connection URL
   - Format: `https://host:port`
   - Or: `https://username:password@host:port`
4. **Environments**: Select "All Environments"
5. **Sensitive**: ✅ Enable (recommended)
6. Click **"Save"**

### Step 3: Add CLICKHOUSE_USERNAME (if needed)

1. Click **"Create new"** in Vercel environment variables
2. **Key**: `CLICKHOUSE_USERNAME`
3. **Value**: `default` (or your username)
4. **Environments**: Select "All Environments"
5. Click **"Save"**

### Step 4: Add NODE_ENV (recommended)

1. Click **"Create new"** in Vercel environment variables
2. **Key**: `NODE_ENV`
3. **Value**: `production`
4. **Environments**: Select "All Environments"
5. Click **"Save"**

### Step 5: Redeploy

⚠️ **IMPORTANT**: After adding environment variables, you **MUST** redeploy:
- Go to your Vercel project dashboard
- Click on the latest deployment
- Click **"Redeploy"** (or push a new commit)
- Wait for deployment to complete

## ✅ Verification Checklist

After adding variables and redeploying, verify:

- [ ] JWT_SECRET is set
- [ ] CLICKHOUSE_URL is set
- [ ] CLICKHOUSE_USERNAME is set (or using default)
- [ ] NODE_ENV is set to `production`
- [ ] Application has been redeployed
- [ ] Health check shows database as "connected"
- [ ] Authentication endpoints work correctly

## 🧪 Test After Setup

Run the test script to verify everything works:

```bash
node scripts/test-api.js https://fitpreeti-yog-backend.vercel.app
```

Check that:
- ✅ Health check shows database as "connected"
- ✅ Authentication (register/login) works
- ✅ All endpoints respond correctly

## 📝 Complete Environment Variables List

Here's what your final list should look like:

```
✅ CLICKHOUSE_PASSWORD
✅ CLICKHOUSE_DATABASE
✅ FRONTEND_URL
✅ BCRYPT_SALT_ROUNDS
✅ API_PREFIX
❌ JWT_SECRET          ← ADD THIS
❌ CLICKHOUSE_URL      ← ADD THIS
⚠️ CLICKHOUSE_USERNAME ← ADD IF NOT 'default'
⚠️ NODE_ENV            ← ADD (set to 'production')
```

## 🔒 Security Notes

- ✅ Enable "Sensitive" for all secrets (JWT_SECRET, CLICKHOUSE_PASSWORD, CLICKHOUSE_URL)
- ✅ Never commit environment variables to Git
- ✅ Use different secrets for different environments
- ✅ Rotate secrets regularly

---

**Next Steps**: Add the missing variables above, then redeploy your application.

