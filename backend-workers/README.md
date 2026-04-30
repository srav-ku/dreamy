# Album API — Cloudflare Workers backend

Hono on Cloudflare Workers, backed by D1 (SQLite). Stores image **URLs only** —
the admin portal uploads files directly to Cloudinary using an unsigned upload
preset.

This package is **not** runnable inside Replit's Node environment. Deploy with
`wrangler` from a machine that has the Cloudflare CLI installed.

## One-time setup

```bash
cd backend-workers
npm install            # or pnpm install -- this directory is its own package

# log in to Cloudflare
npx wrangler login

# create the D1 database — copy the printed database_id into wrangler.toml
npx wrangler d1 create album-db

# apply the schema (remote == production D1; drop --remote for local dev D1)
npm run db:apply:remote

# set the admin password (this is also the bearer token returned to the admin portal)
npx wrangler secret put ADMIN_PASSWORD
```

Edit `wrangler.toml`:
- paste the `database_id` from `wrangler d1 create`
- set `ALLOWED_ORIGINS` to your deployed public-site + admin-portal origins,
  comma separated (use `*` only for local dev)

## Deploy

```bash
npm run deploy
```

The Worker will print a URL like `https://album-api.<your-subdomain>.workers.dev`.
Set `VITE_API_BASE_URL` in both frontends to that URL (no trailing slash).

## Local dev

```bash
npm run dev            # runs at http://localhost:8787
```

## Cloudinary

The frontends upload directly to Cloudinary; the Worker never touches files.

In your Cloudinary dashboard:
1. Settings → Upload → Add an unsigned upload preset.
2. Copy the preset name into the frontends as `VITE_CLOUDINARY_UPLOAD_PRESET`.
3. Copy your cloud name as `VITE_CLOUDINARY_CLOUD_NAME`.

See `API_CONTRACT.md` for the full HTTP contract.
