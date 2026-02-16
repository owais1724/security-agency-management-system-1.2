# 🚀 Deployment Guide (Vercel + Neon)

This guide will help you deploy the **SAMS** project to production.

## 1. Database Setup (Neon)
You have already created your Neon database! 
- **Database URL**: `postgresql://neondb_owner:npg_PUVxDBYao50d@ep-floral-unit-aiiwkkha-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require`

## 2. Deploy Backend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** -> **"Project"**.
2. Select your GitHub repository.
3. **Configure Project**:
   - **Project Name**: `sams-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
4. **Environment Variables**:
   Add the following:
   - `DATABASE_URL`: (Paste your Neon URL here)
   - `JWT_SECRET`: `your_random_secret_string`
   - `JWT_EXPIRATION`: `1d`
   - `NODE_ENV`: `production`
5. Click **Deploy**.

## 3. Deploy Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** -> **"Project"**.
2. Select the same GitHub repository.
3. **Configure Project**:
   - **Project Name**: `sams-frontend`
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
4. **Environment Variables**:
   Add the following:
   - `NEXT_PUBLIC_API_URL`: (The URL of your **deployed backend** from Step 2)
5. Click **Deploy**.

## 4. Run Migrations (One-time)
After deploying the backend, you need to push your database schema to Neon.
Open a terminal in your project folder and run:
```bash
cd backend
# Temporarily set the DATABASE_URL to your Neon URL in your local .env
npx prisma db push
npx prisma db seed
```

---
**Note**: Vercel Serverless has a timeout (10s on Free plan). For a faster and more reliable backend experience, consider **Railway.app** if your API processes become heavy.
