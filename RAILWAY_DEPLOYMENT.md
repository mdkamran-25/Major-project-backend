# 🚀 Railway Deployment Guide - Tsunami Alert Backend

## Quick Timeline: 20-30 minutes total

---

## STEP 1: Create Railway Account (2 mins)

1. Go to **https://railway.app**
2. Click **Sign Up**
3. Choose **Sign up with GitHub** (recommended for automatic deployments)
4. Authorize Railway to access your GitHub account

---

## STEP 2: Create New Project (2 mins)

1. In Railway Dashboard → **+ New Project**
2. Select **Deploy from GitHub repo**
3. Find and select: `Major-Project` (or your repo name)
4. Select branch: `main` (or your default branch)

---

## STEP 3: Add PostgreSQL Database (3 mins)

1. In your Railway project → **+ Add Service**
2. Search for **PostgreSQL**
3. Click **PostgreSQL** to create database service
4. Railway will auto-create and display:
   - **DATABASE_URL** (copy this!)
   - **DIRECT_DATABASE_URL** (same as above)
   - **POSTGRES_PASSWORD** (auto-generated, save it)

---

## STEP 4: Configure Backend Service (5 mins)

### Link GitHub Repository:

1. In Railway project → **+ Add Service** → **GitHub repo**
2. Select `/tsunami-alert-backend` folder (if monorepo)
3. Set **Root Directory** to `tsunami-alert-backend`
4. Set **Dockerfile** as deployment method

### Configure Build & Runtime:

1. Go to backend service settings
2. Set **Build Command**: `npm install && npm run build && npx prisma generate`
3. Set **Start Command**: `node dist/index.js`
4. Set **Port**: `3000` (Railway auto-assigns public URL)

---

## STEP 5: Set Environment Variables (10 mins)

In Railway Backend Service → **Variables** tab, add:

### Database (Copy from PostgreSQL service):

```
DATABASE_URL=postgresql://user:password@host:5432/tsunami_db
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/tsunami_db
```

### Server Config:

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### JWT Secrets (Generate with `openssl rand -hex 32`):

```
JWT_SECRET=<generate-strong-32-char-secret>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
```

### Email Configuration (Gmail):

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<Gmail App Password from myaccount.google.com/apppasswords>
EMAIL_FROM=Tsunami Alert System <alerts@tsunami-system.com>
```

### Firebase Configuration (from service account):

```
FIREBASE_PROJECT_ID=tsunamimvp-99bf1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tsunamimvp-99bf1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<paste-full-PEM-key-from-service-account>
```

### External APIs:

```
USGS_GPS_API_ENDPOINT=https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson
```

---

## STEP 6: Initialize Database (5 mins)

Once PostgreSQL service is running:

1. In Railway, go to PostgreSQL service
2. Click **Connect** → Open Web Terminal or use local connection
3. Run migrations:

```bash
# Option A: Using Railway CLI
railway connect db
npx prisma migrate deploy
npx prisma db seed

# Option B: Using psql locally
psql postgresql://user:password@host:5432/tsunami_db
\i .railway/init.sql
```

---

## STEP 7: Deploy Backend (3 mins)

1. Railway watches your GitHub repo
2. Just push to GitHub and Railway auto-deploys!

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

Railway will:

- ✅ Build Docker image
- ✅ Run npm install & build
- ✅ Generate Prisma client
- ✅ Start Node.js server
- ✅ Assign public URL (e.g., tsunami-alert-backend-prod.up.railway.app)

---

## STEP 8: Get Your Backend URL

1. In Railway Dashboard → Backend Service
2. Copy the public URL from **Domains** section
3. It will look like: `https://tsunami-alert-backend-prod.up.railway.app`

---

## STEP 9: Update Frontend Environment Variables

Update `/tsunami-alert-system10/.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://[YOUR-RAILWAY-BACKEND-URL]/graphql
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT=wss://[YOUR-RAILWAY-BACKEND-URL]/graphql
```

Then push frontend code.

---

## STEP 10: Test the Connection

```bash
# Test GraphQL endpoint
curl https://[YOUR-RAILWAY-BACKEND-URL]/graphql \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"query":"query { __typename }"}'

# Should return: {"data":{"__typename":"Query"}}
```

---

## ⚠️ Troubleshooting

### Build Fails - Missing Dependencies

```bash
# Ensure tsconfig is correct:
npm run build

# Check Prisma client generation:
npx prisma generate
```

### Database Connection Fails

```bash
# Verify DATABASE_URL format:
postgresql://user:password@host:port/dbname

# Test connection locally:
psql $DATABASE_URL -c "SELECT 1;"
```

### WebSocket Errors

- Enable WebSocket support in Railway service settings
- Ensure firewall isn't blocking WS connections

### Prisma Migrations Failing

```bash
# If migrations are stuck:
npx prisma migrate resolve --rolled-back 20240101000000_name
npx prisma migrate deploy
```

---

## 📊 Cost Breakdown

| Service             | Cost/Month  | Notes                     |
| ------------------- | ----------- | ------------------------- |
| PostgreSQL          | $5-12       | Shared to dedicated plans |
| Backend Web Service | $5          | 256MB RAM starter         |
| **Total**           | **~$10-17** | Much cheaper than Render! |

---

## 🎯 Success Checklist

- [ ] GitHub account connected to Railway
- [ ] Project created in Railway
- [ ] PostgreSQL database deployed
- [ ] Backend service configured with Dockerfile
- [ ] All environment variables added
- [ ] Database migrations run successfully
- [ ] Backend deployed and running (check logs)
- [ ] Backend URL copied
- [ ] Frontend .env.local updated with backend URL
- [ ] Frontend deployed
- [ ] GraphQL endpoint responding to queries
- [ ] Login flow working end-to-end

---

## 🚀 Next Steps After Deployment

1. **Monitor Logs**: Railway Dashboard → Backend Service → Logs
2. **Check Health**: `https://[backend-url]/health` should return 200 OK
3. **Run E2E Tests**: Try login flow in frontend
4. **Set Up Alerts**: Railway Dashboard → Alerts for deployment failures

---

## Support & Docs

- Railway Docs: https://docs.railway.app
- PostgreSQL Guide: https://docs.railway.app/guides/postgresql
- Deployments: https://docs.railway.app/reference/deployments

You're ready to deploy! Push to GitHub and Railway will handle the rest! 🎉
