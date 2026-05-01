import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { jwtVerify, createRemoteJWKSet } from "jose";

type Bindings = {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ADMIN_EMAILS: string;
};

type Variables = {};

type Env = {
  Bindings: Bindings;
  Variables: Variables;
};

const app = new Hono<Env>();

const FIREBASE_JWKS_URL = "https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com";
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

app.use("*", async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  return cors({
    origin: (origin) => {
      if (allowed.includes("*")) return origin ?? "*";
      if (origin && allowed.includes(origin)) return origin;
      return "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    maxAge: 86400,
  })(c, next);
});

const json = (c: Context<Env>, body: unknown, status = 200) =>
  c.json(body as Record<string, unknown>, status as 200);
const err = (c: Context<Env>, message: string, status = 400) =>
  json(c, { error: message }, status);

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";

async function uniqueSlug(
  db: D1Database,
  table: "persons" | "albums",
  base: string,
  scope?: { person_id: number },
): Promise<string> {
  let candidate = base;
  let n = 1;
  while (true) {
    const where =
      table === "albums" && scope
        ? "slug = ? AND person_id = ?"
        : "slug = ?";
    const binds: unknown[] =
      table === "albums" && scope ? [candidate, scope.person_id] : [candidate];
    const row = await db
      .prepare(`SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`)
      .bind(...binds)
      .first();
    if (!row) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

async function verifyFirebaseToken(c: Context<Env>, token: string) {
  const projectId = c.env.FIREBASE_PROJECT_ID;
  const allowedEmails = (c.env.ALLOWED_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

  if (!projectId) {
    console.error("FIREBASE_PROJECT_ID not set");
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const email = (payload.email as string || "").toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
      console.warn(`Unauthorized email attempt: ${email}`);
      return null;
    }

    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

async function requireAdmin(c: Context<Env>): Promise<true | Response> {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  
  if (!token) return err(c, "Unauthorized", 401);

  const payload = await verifyFirebaseToken(c, token);
  if (!payload) {
    return err(c, "Unauthorized", 401);
  }

  return true;
}

async function loadPersonAlbums(db: D1Database, personId: number) {
  const { results } = await db
    .prepare(
      `SELECT a.id, a.person_id, a.name, a.slug,
              (SELECT COUNT(*) FROM images i WHERE i.album_id = a.id) AS image_count,
              (SELECT i.thumbnail_url FROM images i WHERE i.album_id = a.id
                 ORDER BY i.order_index ASC, i.created_at ASC LIMIT 1) AS cover_image
         FROM albums a
        WHERE a.person_id = ?
        ORDER BY a.id DESC`,
    )
    .bind(personId)
    .all();
  return results ?? [];
}

// ---------- Health ----------
app.get("/api/healthz", (c) => json(c, { status: "ok" }));

// ---------- Public: persons ----------
app.get("/api/persons", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons ORDER BY id DESC`,
  ).all();
  return json(c, results ?? []);
});

app.get("/api/person/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons WHERE slug = ?`,
  )
    .bind(slug)
    .first();
  if (!row) return err(c, "Not found", 404);
  return json(c, row);
});

app.get("/api/person/:slug/full", async (c) => {
  const slug = c.req.param("slug");
  const person = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons WHERE slug = ?`,
  )
    .bind(slug)
    .first<{ id: number }>();
  if (!person) return err(c, "Not found", 404);
  const albums = await loadPersonAlbums(c.env.DB, person.id);
  return json(c, { ...person, albums });
});

// ---------- Public: albums / images / search ----------
app.get("/api/albums/:personSlug", async (c) => {
  const personSlug = c.req.param("personSlug");
  const person = await c.env.DB.prepare(
    `SELECT id FROM persons WHERE slug = ?`,
  )
    .bind(personSlug)
    .first<{ id: number }>();
  if (!person) return err(c, "Not found", 404);
  return json(c, await loadPersonAlbums(c.env.DB, person.id));
});

app.get("/api/images/:albumSlug", async (c) => {
  const albumSlug = c.req.param("albumSlug");
  const album = await c.env.DB.prepare(
    `SELECT id FROM albums WHERE slug = ? LIMIT 1`,
  )
    .bind(albumSlug)
    .first<{ id: number }>();
  if (!album) return err(c, "Not found", 404);
  const { results } = await c.env.DB.prepare(
    `SELECT id, album_id, image_url, thumbnail_url, order_index, created_at
       FROM images WHERE album_id = ?
       ORDER BY order_index ASC, created_at ASC`,
  )
    .bind(album.id)
    .all();
  return json(c, results ?? []);
});

app.get("/api/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q) return json(c, { persons: [], albums: [] });
  
  const likeQ = `%${q}%`;
  
  const [persons, albums] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, name, slug, profile_image, bio, created_at, updated_at
         FROM persons
        WHERE name LIKE ? OR bio LIKE ?
        ORDER BY name ASC
        LIMIT 20`
    ).bind(likeQ, likeQ).all(),
    c.env.DB.prepare(
      `SELECT a.id, a.name, a.slug, p.slug as person_slug, p.name as person_name
         FROM albums a
         JOIN persons p ON a.person_id = p.id
        WHERE a.name LIKE ?
        ORDER BY a.name ASC
        LIMIT 20`
    ).bind(likeQ).all()
  ]);

  return json(c, { 
    persons: persons.results ?? [], 
    albums: albums.results ?? [] 
  });
});

// ---------- Admin: persons ----------
app.get("/api/admin/person/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons WHERE id = ?`,
  )
    .bind(id)
    .first();
  if (!row) return err(c, "Not found", 404);
  const albums = await loadPersonAlbums(c.env.DB, id);
  return json(c, { ...row, albums });
});

app.post("/api/admin/person", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const body = await c.req.json().catch(() => null);
  if (!body || !body.name || typeof body.name !== "string" || !body.name.trim()) {
    return err(c, "name is required");
  }
  const name = body.name.trim();
  const bio = typeof body.bio === "string" ? body.bio : null;
  const profile_image = typeof body.profile_image === "string" ? body.profile_image : null;
  
  const slug = await uniqueSlug(c.env.DB, "persons", slugify(name));
  const res = await c.env.DB.prepare(
    `INSERT INTO persons (name, slug, profile_image, bio)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(name, slug, profile_image, bio)
    .run();
  const id = res.meta.last_row_id;
  const row = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons WHERE id = ?`,
  )
    .bind(id)
    .first();
  return json(c, row, 201);
});

app.put("/api/admin/person/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return err(c, "invalid id");
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, "invalid body");

  const existing = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio FROM persons WHERE id = ?`,
  )
    .bind(id)
    .first<{
      id: number;
      name: string;
      slug: string;
      profile_image: string | null;
      bio: string | null;
    }>();
  if (!existing) return err(c, "Not found", 404);

  const name =
    typeof body.name === "string" && body.name.trim().length
      ? body.name.trim()
      : existing.name;
  const bio = typeof body.bio === "string" ? body.bio : existing.bio;
  const profile_image =
    typeof body.profile_image === "string"
      ? body.profile_image
      : existing.profile_image;

  let slug = existing.slug;
  if (name !== existing.name) {
    slug = await uniqueSlug(c.env.DB, "persons", slugify(name));
  }

  await c.env.DB.prepare(
    `UPDATE persons
        SET name = ?, slug = ?, profile_image = ?, bio = ?, updated_at = datetime('now')
      WHERE id = ?`,
  )
    .bind(name, slug, profile_image, bio, id)
    .run();

  const row = await c.env.DB.prepare(
    `SELECT id, name, slug, profile_image, bio, created_at, updated_at
       FROM persons WHERE id = ?`,
  )
    .bind(id)
    .first();
  return json(c, row);
});

app.delete("/api/admin/person/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return err(c, "invalid id");

  // D1 supports foreign key cascades if defined, but let's be explicit if needed.
  // The schema has REFERENCES ... ON DELETE CASCADE, so simple delete should work.
  await c.env.DB.prepare("DELETE FROM persons WHERE id = ?").bind(id).run();
  return json(c, { success: true });
});

// ---------- Admin: albums ----------
app.get("/api/admin/album/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `SELECT a.id, a.person_id, a.name, a.slug, p.slug as person_slug
       FROM albums a
       JOIN persons p ON a.person_id = p.id
      WHERE a.id = ?`,
  )
    .bind(id)
    .first();
  if (!row) return err(c, "Not found", 404);
  return json(c, row);
});

app.get("/api/admin/person/:id/albums", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  const albums = await loadPersonAlbums(c.env.DB, id);
  return json(c, albums);
});

app.post("/api/admin/album", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const body = await c.req.json().catch(() => null);
  const person_id = body && Number(body.person_id);
  const name =
    body && typeof body.name === "string" ? body.name.trim() : "";
  if (!Number.isFinite(person_id) || !name) {
    return err(c, "person_id and name are required");
  }

  const person = await c.env.DB.prepare(
    `SELECT id FROM persons WHERE id = ?`,
  )
    .bind(person_id)
    .first();
  if (!person) return err(c, "person not found", 404);

  const slug = await uniqueSlug(c.env.DB, "albums", slugify(name), {
    person_id,
  });
  const res = await c.env.DB.prepare(
    `INSERT INTO albums (person_id, name, slug) VALUES (?, ?, ?)`,
  )
    .bind(person_id, name, slug)
    .run();
  const id = res.meta.last_row_id;
  const row = await c.env.DB.prepare(
    `SELECT a.id, a.person_id, a.name, a.slug,
            0 AS image_count, NULL AS cover_image
       FROM albums a WHERE a.id = ?`,
  )
    .bind(id)
    .first();
  return json(c, row, 201);
});

app.put("/api/admin/album/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  const body = await c.req.json().catch(() => null);
  const name = body && typeof body.name === "string" ? body.name.trim() : "";
  if (!Number.isFinite(id) || !name) {
    return err(c, "id and name are required");
  }

  const existing = await c.env.DB.prepare("SELECT id, person_id, name FROM albums WHERE id = ?")
    .bind(id)
    .first<{ id: number; person_id: number; name: string }>();
  if (!existing) return err(c, "Not found", 404);

  let slug = await uniqueSlug(c.env.DB, "albums", slugify(name), { person_id: existing.person_id });
  
  await c.env.DB.prepare("UPDATE albums SET name = ?, slug = ? WHERE id = ?")
    .bind(name, slug, id)
    .run();

  return json(c, { id, name, slug });
});

app.delete("/api/admin/album/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return err(c, "invalid id");

  await c.env.DB.prepare("DELETE FROM albums WHERE id = ?").bind(id).run();
  return json(c, { success: true });
});

// ---------- Admin: images (batch insert / reorder / delete) ----------
app.post("/api/admin/images", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const body = await c.req.json().catch(() => null);
  const album_id = body && Number(body.album_id);
  const images: Array<{ image_url: string; thumbnail_url: string }> =
    body && Array.isArray(body.images) ? body.images : [];
  if (!Number.isFinite(album_id) || images.length === 0) {
    return err(c, "album_id and non-empty images array are required");
  }

  const album = await c.env.DB.prepare(
    `SELECT id FROM albums WHERE id = ?`,
  )
    .bind(album_id)
    .first();
  if (!album) return err(c, "album not found", 404);

  const maxRow = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(order_index), -1) AS max_order
       FROM images WHERE album_id = ?`,
  )
    .bind(album_id)
    .first<{ max_order: number }>();
  let nextOrder = (maxRow?.max_order ?? -1) + 1;

  const stmt = c.env.DB.prepare(
    `INSERT INTO images (album_id, image_url, thumbnail_url, order_index)
     VALUES (?, ?, ?, ?)`,
  );
  const batch = images
    .filter(
      (i) =>
        i &&
        typeof i.image_url === "string" &&
        typeof i.thumbnail_url === "string",
    )
    .map((i) =>
      stmt.bind(album_id, i.image_url, i.thumbnail_url, nextOrder++),
    );
  if (batch.length === 0) return err(c, "no valid images provided");

  await c.env.DB.batch(batch);

  const { results } = await c.env.DB.prepare(
    `SELECT id, album_id, image_url, thumbnail_url, order_index, created_at
       FROM images
      WHERE album_id = ?
      ORDER BY order_index DESC
      LIMIT ?`,
  )
    .bind(album_id, batch.length)
    .all();
  // restore ascending order for the response
  return json(c, (results ?? []).slice().reverse(), 201);
});

app.put("/api/admin/images/reorder", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const body = await c.req.json().catch(() => null);
  if (!Array.isArray(body)) return err(c, "array of {id, order_index} required");

  const stmt = c.env.DB.prepare("UPDATE images SET order_index = ? WHERE id = ?");
  const batch = body
    .filter(item => typeof item.id === "number" && typeof item.order_index === "number")
    .map(item => stmt.bind(item.order_index, item.id));
  
  if (batch.length > 0) {
    await c.env.DB.batch(batch);
  }
  return json(c, { success: true });
});

app.delete("/api/admin/image/:id", async (c) => {
  const ok = await requireAdmin(c);
  if (ok !== true) return ok;
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return err(c, "invalid id");

  await c.env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
  return json(c, { success: true });
});

// ---------- Fallback ----------
app.notFound((c) => err(c, "Not found", 404));
app.onError((e, c) => {
  console.error("server error", e);
  return err(c, "Server error", 500);
});

export default app;
