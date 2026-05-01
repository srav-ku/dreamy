# Dreamy - Final Deployment Guide

This project is a high-performance image gallery platform with a Google-authenticated admin portal.

## Project Structure
- `/backend-workers`: Cloudflare Workers (Hono + D1)
- `/public-site`: Public-facing gallery (React + Vite)
- `/admin-portal`: Admin management (React + Vite + Firebase Auth)
- `/shared`: Shared logic and types

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

### Environment Variables

**Public Site (`public-site/.env`):**
```env
VITE_API_BASE_URL=https://album-api.your-subdomain.workers.dev
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**Admin Portal (`admin-portal/.env`):**
```env
VITE_API_BASE_URL=https://album-api.your-subdomain.workers.dev
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Firebase Auth Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Build & Deploy

1. **Build:**
   ```bash
   pnpm install
   pnpm run build
   ```

2. **Deploy Public Site:**
   ```bash
   cd public-site
   npx wrangler pages deploy dist --project-name dreamy-public
   ```

3. **Deploy Admin Portal:**
   ```bash
   cd admin-portal
   npx wrangler pages deploy dist --project-name dreamy-admin
   ```

---

## Cloudinary Setup
1. Create an account at [Cloudinary](https://cloudinary.com/).
2. In Settings > Upload, create an **Unsigned** upload preset.
3. Use the Cloud Name and Preset Name in your `.env` files.
