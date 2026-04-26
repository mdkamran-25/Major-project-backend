# 🚀 Railway Production Setup - Complete Guide

## ✅ Pre-Deployment Checklist

### 1. **Backend Configuration**

- ✅ `railway.json` - Build & Start commands configured
- ✅ `Dockerfile` - Multi-stage build optimized
- ✅ `.env.production` - Placeholder values CLEARED
- ✅ `start.sh` - Prisma migrations automated
- ✅ TypeScript builds successfully: `npm run build`

---

## 🔧 Railway Environment Variables Setup

Follow these exact steps in **Railway Dashboard**:

### Step 1: Open Backend Service Variables

1. Go to Railway Dashboard → Select Project
2. Click on **Backend Service**
3. Go to **Variables** tab

### Step 2: Required Environment Variables

Copy and paste EACH of these. Replace placeholder values with actual data:

```
# ═══════════════════════════════════════
# DATABASE (Copy from PostgreSQL Service)
# ═══════════════════════════════════════
DATABASE_URL=<Copy from PostgreSQL Service Variables>
DIRECT_DATABASE_URL=<Same as DATABASE_URL>

# ═══════════════════════════════════════
# NODE ENVIRONMENT
# ═══════════════════════════════════════
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# ═══════════════════════════════════════
# JWT SECRETS (Generate: openssl rand -hex 32)
# ═══════════════════════════════════════
JWT_SECRET=<GENERATE_NEW_SECRET_32_CHARS>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# ═══════════════════════════════════════
# EMAIL CONFIGURATION (Gmail)
# ═══════════════════════════════════════
EMAIL_SERVICE=gmail
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASSWORD=<Gmail App Password from https://myaccount.google.com/apppasswords>
EMAIL_FROM=Tsunami Alert <alerts@tsunami-system.com>

# ═══════════════════════════════════════
# FRONTEND URL (from Vercel)
# ═══════════════════════════════════════
FRONTEND_URL=https://your-vercel-app.com

# ═══════════════════════════════════════
# FIREBASE (from service account JSON)
# ═══════════════════════════════════════
FIREBASE_PROJECT_ID=tsunamimvp-99bf1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-XXXXX@tsunamimvp-99bf1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ═══════════════════════════════════════
# FEATURE FLAGS
# ═══════════════════════════════════════
ENABLE_GPS_INGESTION=true
ENABLE_ALERT_ENGINE=true
ENABLE_SATELLITE_FETCHER=true
```

---

## 🔑 How to Get Each Variable

### 1️⃣ **DATABASE_URL & DIRECT_DATABASE_URL**

```
From Railway Dashboard:
1. Go to PostgreSQL Service
2. Click "Variables" tab
3. Copy the DATABASE_URL value
4. Paste in Backend service variables (both DB_URL fields)
```

### 2️⃣ **JWT_SECRET**

```
Generate in terminal:
$ openssl rand -hex 32
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

Copy the output and paste as JWT_SECRET value
```

### 3️⃣ **EMAIL_PASSWORD (Gmail App Password)**

```
Steps:
1. Go to https://myaccount.google.com/apppasswords
2. Select App: "Mail"
3. Select Device: "Windows PC" (or your device)
4. Google generates 16-char password with spaces
5. Copy WITHOUT spaces and paste
```

### 4️⃣ **FIREBASE_PRIVATE_KEY**

```
From credentials/tsunamimvp-99bf1-d327c4c7061c.json:

1. Open the JSON file
2. Find "private_key" field (starts with -----BEGIN PRIVATE KEY-----)
3. Copy the ENTIRE value including the quotes and \n characters
4. Paste as FIREBASE_PRIVATE_KEY

Example format:
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Deployment Commands (in Railway)

### Build Command:

```
npm install && npm run build && npx prisma generate
```

### Start Command:

```
node dist/index.js
```

### Alternatively (using start.sh with migrations):

```
./start.sh
```

---

## ✅ Verification Checklist After Deployment

### 1. Check Build Logs

```
Railway Dashboard → Backend → Deployments → View Build Logs
Look for:
✅ npm install completed
✅ npm run build succeeded
✅ Prisma generate completed
❌ No TypeScript errors
```

### 2. Check Runtime Logs

```
Railway Dashboard → Backend → View Logs
Look for:
✅ "Database connected"
✅ "Apollo Server created"
✅ "Express middleware configured"
✅ "Starting real-time services"
```

### 3. Test GraphQL Endpoint

```
URL: https://<railway-backend-url>/graphql

Query to test:
{
  systemStatus {
    isHealthy
    uptime
  }
}
```

### 4. Verify Environment Variables Are Loaded

```
Query:
{
  systemStatus {
    environment
    nodeEnv
    port
  }
}
```

---

## ❌ Common Issues & Solutions

### Issue 1: Database Connection Failed

```
Error: "Error: connect ECONNREFUSED"

Solutions:
1. Verify DATABASE_URL is copied correctly from PostgreSQL service
2. Check DATABASE_URL format: postgresql://user:password@host:port/db
3. Wait 30 seconds for PostgreSQL service to start
4. Click "Redeploy" in Railway Dashboard
```

### Issue 2: Build Fails - TypeScript Errors

```
Error: "tsc: command not found" or TypeScript errors

Solutions:
1. Ensure package.json is in root: /tsunami-alert-backend/
2. Verify tsconfig.json exists
3. Run locally: npm run build (to find errors)
4. Fix errors and commit to GitHub
5. Railway will auto-redeploy on push
```

### Issue 3: Prisma Migration Fails

```
Error: "Prisma migration failed"

Solutions:
1. Ensure DIRECT_DATABASE_URL is set correctly
2. Check migrations in prisma/migrations/ folder exist
3. Use start.sh which has migration fallback logic
4. Manually reset: npx prisma migrate reset (careful!)
```

### Issue 4: Environment Variables Not Found

```
Error: "Cannot read property 'JWT_SECRET' of undefined"

Solutions:
1. Reload page in Railway Dashboard
2. Re-add the variable (copy/paste issue)
3. Check for typos in variable names
4. Redeploy the service
```

### Issue 5: Port Not PublicURL

```
Error: "Service running but no public URL"

Solutions:
1. Go to Backend service → Settings
2. Verify "Expose to Internet" is ENABLED
3. Check PORT variable is set to 3000
4. Wait 1-2 minutes for URL generation
```

---

## 🔍 Troubleshooting Steps

### Step 1: Check Deployment Status

```
Railway Dashboard → Backend → Deployments
Status should show: ✅ Complete (green)
```

### Step 2: View Real-time Logs

```
Railway Dashboard → Backend → Logs
Click "View Full Logs" for more details
Tail logs: Shows last 100 lines continuously
```

### Step 3: Test Service Health

```
GET https://<railway-url>/health
Should return: 200 OK

GET https://<railway-url>/graphql
Should return: GraphQL Playground or 200 OK
```

### Step 4: Check Variable Input

```
Railway Dashboard → Backend → Variables
Verify each variable:
- No leading/trailing spaces
- No extra quotes
- Correct format
- Special characters properly escaped
```

### Step 5: Database Connection Test

```
Include in logs deployment:
Add: LOG_LEVEL=debug

This shows:
- Connection attempts
- Error details
- Timeout information
```

---

## 📝 Summary: Required Variables

| Variable             | Required | Source                |
| -------------------- | -------- | --------------------- |
| DATABASE_URL         | ✅ Yes   | PostgreSQL Service    |
| DIRECT_DATABASE_URL  | ✅ Yes   | PostgreSQL Service    |
| NODE_ENV             | ✅ Yes   | Set to: `production`  |
| PORT                 | ✅ Yes   | Set to: `3000`        |
| JWT_SECRET           | ✅ Yes   | Generate with openssl |
| EMAIL_USER           | ✅ Yes   | Your Gmail            |
| EMAIL_PASSWORD       | ✅ Yes   | Gmail App Password    |
| FIREBASE_PRIVATE_KEY | ✅ Yes   | JSON credentials      |
| FRONTEND_URL         | ✅ Yes   | Vercel frontend URL   |

---

## 🆘 Still Having Issues?

1. **Check Railway Status**: https://www.railway.app/status
2. **Rebuild**: Railway Dashboard → Backend → Redeploy
3. **Clear Cache**: Remove `.rail` folder, push to GitHub force-redeploy
4. **Contact Support**: Railway support dashboard

---

## ✨ Notes

- Railway automatically restarts service if it crashes
- Logs are retained for 7 days
- Database backups happen daily
- All data encrypted in transit and at rest
