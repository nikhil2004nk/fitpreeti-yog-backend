# Production Deployment Guide

## Server Deployment Steps

### 1. **Upload Files to Server**

Upload these files to `/home/fitpreeti/fitpreeti/fitpreeti-yog-backend/`:
- ✅ `Dockerfile` (production-ready, multi-stage)
- ✅ `docker-compose.yml` (updated with correct entry point)
- ✅ `.dockerignore` (excludes unnecessary files)
- ✅ `package.json` (with updated build scripts)
- ✅ `api/index.ts` (with standalone server mode)
- ✅ All source code

#### **Option A: Using SCP (Command Line - Recommended)**

From your **local Windows machine** (PowerShell or Git Bash):

```powershell
# Navigate to your project directory
cd "C:\Users\Nik\OneDrive\Desktop\Fitpreeti yog institute\fitpreeti-yog-backend"

# Upload entire project (excludes files in .gitignore)
scp -r * fitpreeti@srv1279934.hosted-by-vdsina.ru:~/fitpreeti/fitpreeti-yog-backend/

# Or upload specific files only:
scp Dockerfile docker-compose.yml .dockerignore package.json fitpreeti@srv1279934.hosted-by-vdsina.ru:~/fitpreeti/fitpreeti-yog-backend/
scp -r api/ src/ fitpreeti@srv1279934.hosted-by-vdsina.ru:~/fitpreeti/fitpreeti-yog-backend/
```

#### **Option B: Using Git (If you have a repository)**

```bash
# On your local machine - commit and push changes
git add .
git commit -m "Fix Docker production deployment"
git push origin main

# On your server - pull the latest changes
cd ~/fitpreeti/fitpreeti-yog-backend
git pull origin main
```

#### **Option C: Using SFTP Client (WinSCP, FileZilla, etc.)**

1. **Download WinSCP** (free): https://winscp.net/
2. **Connect to server:**
   - Host: `srv1279934.hosted-by-vdsina.ru`
   - Username: `fitpreeti`
   - Password: (your server password)
3. **Navigate to:** `/home/fitpreeti/fitpreeti/fitpreeti-yog-backend/`
4. **Drag and drop** files from your local folder

#### **Option D: Using VS Code Remote SSH Extension**

1. **Install "Remote - SSH" extension** in VS Code
2. **Connect to server:** `ssh fitpreeti@srv1279934.hosted-by-vdsina.ru`
3. **Open folder:** `/home/fitpreeti/fitpreeti/fitpreeti-yog-backend`
4. **Copy/paste files** directly in VS Code

#### **Option E: Using rsync (Most Efficient - Only Uploads Changes)**

```bash
# From your local machine (Git Bash or WSL)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ fitpreeti@srv1279934.hosted-by-vdsina.ru:~/fitpreeti/fitpreeti-yog-backend/
```

### 2. **On Your Server, Run:**

```bash
cd /home/fitpreeti/fitpreeti/fitpreeti-yog-backend

# If you get "local changes would be overwritten" error:
# Option A: Keep your local Dockerfile (recommended)
git stash
git pull origin main
git stash pop  # Reapply your local changes

# If you get a merge conflict in Dockerfile:
# Use the remote version (production-ready) - RECOMMENDED
git checkout --theirs Dockerfile
git add Dockerfile
git stash drop  # Remove the stash since we're using remote version

# Option B: Use remote version (discard local changes)
# git checkout -- Dockerfile
# git pull origin main

# Option C: Commit your local changes first
# git add Dockerfile docker-compose.yml .dockerignore package.json api/index.ts
# git commit -m "Fix Docker production deployment"
# git pull origin main

# Stop the old backend container
docker compose stop backend

# Remove old container (keeps volumes)
docker compose rm -f backend

# Rebuild with new Dockerfile
docker compose build --no-cache backend

# Start the new backend
docker compose up -d backend

# Check logs
docker compose logs -f backend
```

### 3. **Verify Deployment**

```bash
# Check container status
docker compose ps

# Check backend logs
docker compose logs backend --tail 50

# Test health endpoint
curl http://localhost:3000/api/v1/health

# Check if container is healthy
docker inspect fitpreeti_backend | grep -A 10 Health
```

### 4. **Key Changes Made**

✅ **Entry Point Fixed**: Now uses `dist/api/index.js` (not `dist/main.js`)  
✅ **Multi-stage Build**: Smaller production image (<150MB)  
✅ **Non-root User**: Security best practice  
✅ **Health Checks**: Automatic container health monitoring  
✅ **Graceful Shutdown**: Proper SIGTERM/SIGINT handling  
✅ **Legacy Peer Deps**: Resolves @nestjs/config conflicts  

### 5. **Environment Variables**

The `docker-compose.yml` includes all required variables:
- Database: `DB_HOST=fitpreeti_mysql_dev` (container name)
- JWT: `JWT_SECRET` and `JWT_REFRESH_SECRET`
- URLs: Frontend and backend URLs for CORS
- Timezone: `TZ=Asia/Kolkata`

### 6. **Troubleshooting**

**If backend keeps restarting:**
```bash
# Check logs for errors
docker compose logs backend

# Common issues:
# - Database connection: Verify DB_HOST=fitpreeti_mysql_dev
# - Missing env vars: Check all required variables are set
# - Port conflicts: Ensure port 3000 is available
```

**Rebuild from scratch:**
```bash
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### 7. **Production Checklist**

- [ ] All environment variables set correctly
- [ ] Database connection working (`DB_HOST=fitpreeti_mysql_dev`)
- [ ] Health endpoint responding: `/api/v1/health`
- [ ] Container shows "healthy" status
- [ ] Logs show successful startup
- [ ] No restart loops
- [ ] API accessible at `https://fitpreetiyoginstitute.com/api/v1/*`
