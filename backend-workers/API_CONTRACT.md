# Album Backend API Contract

The Cloudflare Workers backend (Hono + D1) exposes these endpoints at `VITE_API_BASE_URL`.

All responses are JSON. All `created_at` / `updated_at` fields are ISO 8601 strings.

## Data types

```ts
type Person = {
  id: number;
  name: string;
  slug: string;
  profile_image: string | null;  // Cloudinary URL
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type Album = {
  id: number;
  person_id: number;
  name: string;
  slug: string;
  cover_image: string | null;     // first image thumb (server-computed)
  image_count: number;            // server-computed
};

type Image = {
  id: number;
  album_id: number;
  image_url: string;              // full Cloudinary URL
  thumbnail_url: string;          // Cloudinary thumb (auto format, w_300)
  order_index: number;
  created_at: string;
};

type PersonFull = Person & {
  albums: Album[];
};
```

## Public endpoints (no auth)

- `GET /api/persons`
  → `Person[]`
- `GET /api/person/:slug`
  → `Person`
- `GET /api/person/:slug/full`
  → `PersonFull`     (person + nested albums; one round-trip for the person page)
- `GET /api/albums/:personSlug`
  → `Album[]`
- `GET /api/images/:albumSlug`
  → `Image[]`        (sorted by order_index asc, then created_at)
- `GET /api/search?q=<query>`
  → `Person[]`       (LIKE 'q%' on lowercased name; empty array if q is blank)

## Admin endpoints

### Login
- `POST /api/admin/login`
  body: `{ password: string }`
  → 200 `{ token: string }`  (token === ADMIN_PASSWORD env var)
  → 401 `{ error: "Invalid password" }`

All other admin endpoints require:
`Authorization: Bearer <token>` header.

### Persons
- `POST /api/admin/person`
  body: `{ name: string; bio?: string; profile_image?: string }`
  → 201 `Person`     (slug auto-generated from name; uniqueness enforced)
- `PUT /api/admin/person/:id`
  body: `{ name?: string; bio?: string; profile_image?: string }`
  → 200 `Person`

### Albums
- `POST /api/admin/album`
  body: `{ person_id: number; name: string }`
  → 201 `Album`      (slug auto-generated from name)

### Images
- `POST /api/admin/images`
  body: `{ album_id: number; images: Array<{ image_url: string; thumbnail_url: string }> }`
  → 201 `Image[]`    (order_index assigned automatically, appended)

## Errors

- 400 `{ error: "..." }` validation errors
- 401 `{ error: "Unauthorized" }` missing/invalid token
- 404 `{ error: "Not found" }` unknown slug/id
- 409 `{ error: "..." }` slug conflict
- 500 `{ error: "Server error" }`

## Cloudinary

The frontend uploads images **directly** to Cloudinary using an unsigned upload preset.
The backend never receives the file — only the resulting URLs.

Upload flow (admin portal):
1. POST `https://api.cloudinary.com/v1_1/<VITE_CLOUDINARY_CLOUD_NAME>/image/upload`
   FormData: `file=<File>`, `upload_preset=<VITE_CLOUDINARY_UPLOAD_PRESET>`
2. Response includes `secure_url` (use as `image_url`).
3. Build `thumbnail_url` by inserting `/upload/c_fill,f_auto,q_auto,w_600/` in place of `/upload/`.
   For grid thumbs the public site can request even smaller widths the same way (`w_300`).
4. Send `{ image_url, thumbnail_url }` (and `album_id`) to `POST /api/admin/images`.

For profile images the same pattern is used; thumbnail isn't needed — store only the
`secure_url` in `profile_image`. The public site can request a 200x200 crop on the fly:
`/upload/c_fill,g_face,w_200,h_200/`.
