# Dreamy - Final Deployment Guide

This project is a high-performance image gallery platform with a Google-authenticated admin portal.

## Project Structure
- `/backend-workers`: Cloudflare Workers (Hono + D1)
- `/public-site`: Public-facing gallery (React + Vite)
- `/admin-portal`: Admin management (React + Vite + Firebase Auth)
- `/shared`: Shared logic and types

---

### ⚠️ CRITICAL: The "localhost:8787" Error

If your deployed site shows errors like `Failed to load resource: net::ERR_CONNECTION_REFUSED` for `localhost:8787`, it means your frontend was **built** with the wrong environment variables.

**Vite environment variables (`VITE_*`) are injected at BUILD TIME.** 
- If you run `pnpm run build` locally, it uses your local `.env` file.
- If you then deploy that `dist` folder, it will still point to whatever was in that `.env` file (e.g., localhost).

---

## 1. Database Setup (Cloudflare D1)

1. Authenticate with Wrangler:
   ```bash
   npx wrangler login
   ```

2. Create the D1 database:
   ```bash
   npx wrangler d1 create album-db
   ```
   *Copy the `database_id` and paste it into `backend-workers/wrangler.toml`.*

3. Apply the schema:
   ```bash
   cd backend-workers
   npx wrangler d1 execute album-db --remote --file=./schema.sql
   ```

---

## 2. Backend Deployment (Cloudflare Workers)

1. Set Secrets:
   ```bash
   cd backend-workers
   # Allowed admin emails (comma-separated)
   npx wrangler secret put ALLOWED_ADMIN_EMAILS
   # Firebase Project ID
   npx wrangler secret put FIREBASE_PROJECT_ID
   ```

2. Deploy:
   ```bash
   npx wrangler deploy
   ```
   *Note your Worker URL (e.g., `https://album-api.your-subdomain.workers.dev`).*

---

## 3. Frontend Deployment (Cloudflare Pages)

### Option A: Manual Deployment (Local Build + Direct Upload)
*Use this if you want to deploy from your terminal.*

1. **Update your `.env` files** in `public-site/.env` and `admin-portal/.env`:
   ```env
   VITE_API_BASE_URL=https://album-api.your-subdomain.workers.dev
   ```
2. **Build the projects:**
   ```bash
   pnpm run build
   ```
3. **Deploy:**
   ```bash
   cd public-site
   npx wrangler pages deploy dist --project-name dreamy-public
   cd ../admin-portal
   npx wrangler pages deploy dist --project-name dreamy-admin
   ```

### Option B: Git Integration (Auto-build on Push)
*Use this if you connected your GitHub/GitLab repo to Cloudflare Pages.*

1. Go to the Cloudflare Dashboard → Workers & Pages.
2. Select your Pages project.
3. Go to **Settings** → **Environment variables**.
4. Add `VITE_API_BASE_URL` with your Worker URL for **both** Production and Preview environments.
5. **CRITICAL:** You must **Trigger a new deployment** (redeploy) after changing these settings for them to take effect in the build.

---

## 4. PowerShell Guide — Create a **New** Cloudflare Pages Deployment (Not Redeploy)

Use this when you want a fresh Pages project instead of reusing `dreamy-public` / `dreamy-admin`.

> Run these commands from **Windows PowerShell**.

### 4.1 Login and install deps
```powershell
pnpm install
npx wrangler login
```

### 4.2 Generate unique project names
```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$PublicProject = "dreamy-public-$stamp"
$AdminProject = "dreamy-admin-$stamp"

Write-Host "Public project: $PublicProject"
Write-Host "Admin project:  $AdminProject"
```

### 4.3 Build both frontends
```powershell
pnpm run build
```

### 4.4 Create and deploy a new Public Pages project
```powershell
cd public-site
npx wrangler pages project create $PublicProject --production-branch main
npx wrangler pages deploy dist --project-name $PublicProject
cd ..
```

### 4.5 Set Public project environment variables (Production)
```powershell
npx wrangler pages secret put VITE_API_BASE_URL --project-name $PublicProject
npx wrangler pages secret put VITE_CLOUDINARY_CLOUD_NAME --project-name $PublicProject
```

After setting secrets, deploy once more so the new build uses them:
```powershell
cd public-site
npx wrangler pages deploy dist --project-name $PublicProject
cd ..
```

### 4.6 Create and deploy a new Admin Pages project
```powershell
cd admin-portal
npx wrangler pages project create $AdminProject --production-branch main
npx wrangler pages deploy dist --project-name $AdminProject
cd ..
```

### 4.7 Set Admin project environment variables (Production)
```powershell
npx wrangler pages secret put VITE_API_BASE_URL --project-name $AdminProject
npx wrangler pages secret put VITE_CLOUDINARY_CLOUD_NAME --project-name $AdminProject
npx wrangler pages secret put VITE_CLOUDINARY_UPLOAD_PRESET --project-name $AdminProject
npx wrangler pages secret put VITE_FIREBASE_API_KEY --project-name $AdminProject
npx wrangler pages secret put VITE_FIREBASE_AUTH_DOMAIN --project-name $AdminProject
npx wrangler pages secret put VITE_FIREBASE_PROJECT_ID --project-name $AdminProject
npx wrangler pages secret put VITE_FIREBASE_APP_ID --project-name $AdminProject
```

After setting secrets, deploy once more so the new build uses them:
```powershell
cd admin-portal
npx wrangler pages deploy dist --project-name $AdminProject
cd ..
```

### 4.8 Verify URLs and API target
1. Open both new `*.pages.dev` URLs from the deploy output.
2. In browser devtools → Network, verify requests go to:
   `https://album-api.your-subdomain.workers.dev/api/...`
3. Ensure no request is going to `http://localhost:8787`.

---

## Cloudinary Setup
1. Create an account at [Cloudinary](https://cloudinary.com/).
2. In Settings > Upload, create an **Unsigned** upload preset.
3. Use the Cloud Name and Preset Name in your `.env` files.
