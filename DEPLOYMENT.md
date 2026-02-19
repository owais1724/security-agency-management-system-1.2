
# 🚀 Deployment Instructions for Railway

## 1. Create a Project on Railway.app
1. Go to [Railway.app](https://railway.app) and sign in.
2. Click **"New Project"**.
3. Select **"Provision PostgreSQL"**.
   - After it's created, copy the **Connection URL** from the "Connect" tab.

## 2. Deploy Backend
1. In the same project, click **New** → **GitHub Repo**.
2. Select this repository.
3. Click the new service card → **Settings**.
4. Set **Root Directory** to `/backend`.
5. Set **Build Command**: `npm install && npm run build`
6. Set **Start Command**: `npm run start:prod`
7. Go to **Variables** tab and add:
   - `DATABASE_URL`: (Paste the Postgres URL from step 1)
   - `JWT_SECRET`: (Any long random string)
   - `NODE_ENV`: production

## 3. Deploy Frontend
1. Click **New** → **GitHub Repo** → Select this repository again.
2. Click the new service card → **Settings**.
3. Set **Root Directory** to `/frontend`.
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm start`
6. Go to **Variables** tab:
   - `NEXT_PUBLIC_API_URL`: (Paste your Backend service URL, e.g., https://backend-production.up.railway.app)

## 4. Final Connection
1. Go back to **Backend Service** → Variables.
2. Add `FRONTEND_URL`: (Paste your Frontend service URL).
3. Redeploy the Backend.
