# Album

A photo album platform: persons → albums → images, with a public browsing site
and a separate admin portal. Built per the user's spec exactly as requested.

## Architecture

- **Backend** (`backend-workers/`): Cloudflare Workers + Hono + D1 (SQLite).
  Stores image **URLs only** — uploads go directly from the admin portal to
  Cloudinary. Not runnable inside Replit; deployed via `wrangler`.
  See `backend-workers/README.md` and `backend-workers/API_CONTRACT.md`.
- **Public site** (`artifacts/public-site/`): React + Vite, served at `/`.
  Browses persons, their albums, and images.
- **Admin portal** (`artifacts/admin-portal/`): React + Vite, served at `/admin/`.
  Token-gated CRUD for persons / albums / images, plus direct Cloudinary upload.
- **Pre-existing scaffolding** (`artifacts/api-server`, `lib/api-spec`, `lib/db`,
  `lib/api-client-react`, `artifacts/mockup-sandbox`): leftover from the
  monorepo template, not used by Album. Safe to ignore or remove later.

## Required env vars / secrets

Frontends (already configured in this Repl):
- `VITE_API_BASE_URL` — base URL of the deployed Worker (no trailing slash).
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET` — must be an **unsigned** preset.

Worker (set with `wrangler secret put` after deploy):
- `ADMIN_PASSWORD` — the password the admin types in to log in. Doubles as the
  bearer token returned to the admin portal.
- `ALLOWED_ORIGINS` (in `wrangler.toml` `[vars]`): comma-separated list of the
  deployed public + admin origins, or `*` for local dev.

## Stack

- Workers runtime: Hono 4
- D1 (SQLite) — schema in `backend-workers/schema.sql`
- React 18 + Vite, Wouter, TanStack Query, Tailwind, framer-motion, sonner
- Cloudinary (unsigned uploads from the browser)

## Deploying the backend

See `backend-workers/README.md` for full steps. Short version:
```
cd backend-workers
npx wrangler login
npx wrangler d1 create album-db        # paste database_id into wrangler.toml
npm run db:apply:remote                # apply schema.sql
npx wrangler secret put ADMIN_PASSWORD
npm run deploy
```
Then set `VITE_API_BASE_URL` in this Repl to the printed Worker URL and restart
both frontend workflows.
