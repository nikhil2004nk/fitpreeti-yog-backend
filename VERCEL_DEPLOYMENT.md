# Vercel Deployment Guide for Fitpreeti Yog Backend

This guide will walk you through deploying your NestJS backend application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Your project pushed to the repository
4. All environment variables ready

## Step-by-Step Deployment Instructions

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 2: Prepare Your Project

The following files have been created/updated for Vercel deployment:
- ✅ `vercel.json` - Vercel configuration
- ✅ `api/index.ts` - Serverless function handler
- ✅ `package.json` - Added helmet dependency

### Step 3: Install Dependencies Locally

Make sure all dependencies are installed:

```bash
npm install
```

### Step 4: Test Build Locally (Optional)

Test that your project builds correctly:

```bash
npm run build
```

### Step 5: Deploy via Vercel Dashboard

#### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in or create an account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Project**
   - **Framework Preset**: Other (or leave as default)
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   Click "Environment Variables" and add all required variables:

   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=1h
   ACCESS_TOKEN_EXPIRES_IN=15m
   CLICKHOUSE_URL=https://your-clickhouse-url
   CLICKHOUSE_USERNAME=default
   CLICKHOUSE_PASSWORD=your-password
   CLICKHOUSE_DATABASE=fitpreeti
   FRONTEND_URL=https://your-frontend-url.vercel.app
   BCRYPT_SALT_ROUNDS=12
   API_PREFIX=/api/v1
   ```

   **Important Notes:**
   - Replace placeholder values with your actual credentials
   - Make sure `FRONTEND_URL` matches your frontend deployment URL
   - Keep `JWT_SECRET` secure and use a strong random string
   - ClickHouse URL should be your production database URL

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your API will be available at: `https://your-project-name.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account/team)
   - Link to existing project? **No** (for first deployment)
   - Project name? (Enter your project name or press Enter for default)
   - Directory? **./** (current directory)
   - Override settings? **No**

3. **Set Environment Variables**
   ```bash
   vercel env add NODE_ENV
   vercel env add JWT_SECRET
   vercel env add CLICKHOUSE_URL
   vercel env add CLICKHOUSE_USERNAME
   vercel env add CLICKHOUSE_PASSWORD
   vercel env add CLICKHOUSE_DATABASE
   vercel env add FRONTEND_URL
   # ... add all other variables
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Step 6: Verify Deployment

1. **Check Deployment Status**
   - Go to your Vercel dashboard
   - Check the deployment logs for any errors

2. **Test Your API**
   - Visit: `https://your-project-name.vercel.app/api/v1/health`
   - Should return a health check response
   - Visit: `https://your-project-name.vercel.app/api` (if Swagger is enabled)
   - Should show Swagger documentation

3. **Test API Endpoints**
   ```bash
   curl https://your-project-name.vercel.app/api/v1/health
   ```

### Step 7: Update Frontend Configuration

Update your frontend application to use the new Vercel backend URL:

```javascript
// In your frontend .env or config
VITE_API_URL=https://your-project-name.vercel.app/api/v1
// or
REACT_APP_API_URL=https://your-project-name.vercel.app/api/v1
```

## Important Configuration Notes

### CORS Configuration

The `api/index.ts` file is configured to:
- Allow your frontend URL (from `FRONTEND_URL` env variable)
- Allow all Vercel preview URLs (`.vercel.app` and `.vercel.dev` domains)
- Allow localhost in development mode

### Environment Variables

All environment variables must be set in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add variables for Production, Preview, and Development environments
- After adding variables, redeploy your project

### API Routes

Your API will be available at:
- Base URL: `https://your-project-name.vercel.app`
- API Endpoints: `https://your-project-name.vercel.app/api/v1/*`
- Swagger Docs: `https://your-project-name.vercel.app/api` (if enabled)

### Function Timeout

The serverless function is configured with a 30-second timeout. If you need longer:
- Update `maxDuration` in `vercel.json`
- Note: Vercel Pro plan allows up to 60 seconds, Enterprise allows up to 300 seconds

## Troubleshooting

### Build Errors

1. **TypeScript Errors**
   - Run `npm run build` locally to check for errors
   - Fix any TypeScript compilation errors

2. **Missing Dependencies**
   - Ensure all dependencies are in `package.json`
   - Check that `node_modules` is not in `.gitignore` (it shouldn't be)

3. **Environment Variable Errors**
   - Verify all required env variables are set in Vercel
   - Check the deployment logs for validation errors

### Runtime Errors

1. **CORS Issues**
   - Verify `FRONTEND_URL` is set correctly
   - Check that your frontend URL matches exactly (including https/http)

2. **Database Connection Issues**
   - Verify ClickHouse URL and credentials
   - Check if your ClickHouse instance allows connections from Vercel IPs
   - You may need to whitelist Vercel IPs or use a public database

3. **Function Timeout**
   - Check logs for slow queries
   - Optimize database queries
   - Consider increasing timeout in `vercel.json`

### Common Issues

1. **"Module not found" errors**
   - Ensure all dependencies are listed in `package.json`
   - Run `npm install` and commit `package-lock.json`

2. **"Cannot find module" errors**
   - Check import paths in `api/index.ts`
   - Ensure relative paths are correct

3. **Environment variables not working**
   - Redeploy after adding environment variables
   - Check variable names match exactly (case-sensitive)

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch deploys to production
- Every push to other branches creates a preview deployment
- Preview deployments have their own URLs for testing

## Monitoring

- Check Vercel dashboard for:
  - Deployment logs
  - Function logs
  - Analytics (if enabled)
  - Error tracking

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Keep ClickHouse credentials secure** - Only set in Vercel dashboard
4. **Enable Vercel Security Headers** - Already configured via Helmet
5. **Use HTTPS only** - Vercel provides this automatically

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Test API endpoints
4. ✅ Update frontend to use new API URL
5. ✅ Monitor deployment logs
6. ✅ Set up custom domain (optional)

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- NestJS Documentation: [docs.nestjs.com](https://docs.nestjs.com)

---

**Your API will be live at:** `https://your-project-name.vercel.app`

Good luck with your deployment! 🚀

