# Frontend Changes Required for Vercel Deployment

Based on the Vercel deployment configuration, here are the **required changes** you need to make in your frontend application.

## 🔴 Critical Changes

### 1. Update API Base URL

**Change Required:** Update your frontend API base URL from localhost to your Vercel deployment URL.

#### For React/Vite Applications

**Before (Development):**
```javascript
// .env.local or config file
VITE_API_URL=http://localhost:3000/api/v1
```

**After (Production):**
```javascript
// .env.production or config file
VITE_API_URL=https://your-project-name.vercel.app/api/v1
```

#### For Create React App

**Before (Development):**
```javascript
// .env.local
REACT_APP_API_URL=http://localhost:3000/api/v1
```

**After (Production):**
```javascript
// .env.production
REACT_APP_API_URL=https://your-project-name.vercel.app/api/v1
```

#### Example API Configuration

```javascript
// src/config/api.js or similar
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-project-name.vercel.app/api/v1'
    : 'http://localhost:3000/api/v1');

export default API_BASE_URL;
```

### 2. Ensure Credentials are Included

**Critical:** All API requests MUST include `credentials: 'include'` for cookie-based authentication to work.

#### Fetch API Example

```javascript
// ✅ CORRECT - Include credentials
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  credentials: 'include', // REQUIRED for cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone, pin })
});

// ❌ WRONG - Missing credentials
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone, pin })
});
```

#### Axios Configuration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // REQUIRED for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### 3. Update CORS Configuration

**Important:** Make sure your frontend URL matches the `FRONTEND_URL` environment variable set in Vercel.

The backend CORS is configured to allow:
- The `FRONTEND_URL` environment variable value
- All Vercel preview URLs (`.vercel.app` and `.vercel.dev` domains)
- Localhost in development mode

**Action Required:**
- Ensure `FRONTEND_URL` in Vercel matches your frontend deployment URL exactly (including `https://`)
- If your frontend is also on Vercel, it should work automatically

## 📋 Complete Frontend API Service Example

Here's a complete example of how to set up your API service:

```javascript
// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-project-name.vercel.app/api/v1'
    : 'http://localhost:3000/api/v1');

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      credentials: 'include', // REQUIRED for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle 401 - Try to refresh token
      if (response.status === 401 && endpoint !== '/auth/refresh') {
        try {
          await this.refreshToken();
          // Retry original request
          return this.request(endpoint, options);
        } catch (error) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw error;
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(phone, pin) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // Other API methods...
  async getServices() {
    return this.request('/services', {
      method: 'GET',
    });
  }

  async getTrainers() {
    return this.request('/trainers', {
      method: 'GET',
    });
  }
}

export default new ApiService();
```

## 🔧 Environment Variables Setup

### For Vite Projects

Create/update these files:

**`.env.development`**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

**`.env.production`**
```env
VITE_API_URL=https://your-project-name.vercel.app/api/v1
```

### For Create React App

**`.env.development`**
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
```

**`.env.production`**
```env
REACT_APP_API_URL=https://your-project-name.vercel.app/api/v1
```

## ✅ Checklist

Before deploying your frontend, verify:

- [ ] API base URL is updated to Vercel deployment URL
- [ ] All fetch/axios requests include `credentials: 'include'` or `withCredentials: true`
- [ ] Environment variables are set correctly for production
- [ ] `FRONTEND_URL` in Vercel backend matches your frontend URL
- [ ] Test authentication flow (login/logout) works
- [ ] Test API calls work with the new backend URL
- [ ] CORS errors are resolved

## 🧪 Testing

After making changes, test these endpoints:

1. **Health Check**
   ```javascript
   fetch('https://your-project-name.vercel.app/api/v1/health', {
     credentials: 'include'
   });
   ```

2. **Login**
   ```javascript
   fetch('https://your-project-name.vercel.app/api/v1/auth/login', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ phone: '1234567890', pin: '123456' })
   });
   ```

3. **Get Profile** (after login)
   ```javascript
   fetch('https://your-project-name.vercel.app/api/v1/auth/profile', {
     credentials: 'include'
   });
   ```

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors

**Problem:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
- Verify `FRONTEND_URL` in Vercel backend matches your frontend URL exactly
- Ensure `credentials: 'include'` is set in all requests
- Check that your frontend URL includes `https://` protocol

### Issue 2: Cookies Not Being Sent

**Problem:** Authentication fails because cookies aren't being sent

**Solution:**
- Add `credentials: 'include'` to all fetch requests
- For Axios, set `withCredentials: true`
- Ensure frontend and backend are on the same domain or properly configured for cross-origin cookies

### Issue 3: 401 Unauthorized Errors

**Problem:** Getting 401 errors even after login

**Solution:**
- Verify cookies are being set (check browser DevTools → Application → Cookies)
- Implement token refresh logic (see example above)
- Check that `credentials: 'include'` is set on all authenticated requests

## 📝 Summary

**Minimum Required Changes:**

1. ✅ Update API base URL from `http://localhost:3000/api/v1` to `https://your-project-name.vercel.app/api/v1`
2. ✅ Ensure all API requests include `credentials: 'include'` (or `withCredentials: true` for Axios)
3. ✅ Set `FRONTEND_URL` in Vercel backend to match your frontend deployment URL

**That's it!** The backend is already configured to handle CORS and cookie-based authentication for Vercel deployments.

---

**Note:** Replace `your-project-name.vercel.app` with your actual Vercel deployment URL.

