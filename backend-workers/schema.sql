-- Album D1 schema. Apply with:
--   wrangler d1 execute album-db --remote --file=./schema.sql
-- (drop "--remote" to apply to the local dev D1 instead).

CREATE TABLE IF NOT EXISTS persons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  profile_image TEXT,
  bio           TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS persons_slug_idx ON persons(slug);
CREATE INDEX IF NOT EXISTS persons_name_lower_idx ON persons(LOWER(name));

CREATE TABLE IF NOT EXISTS albums (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id  INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  slug       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(person_id, slug)
);

CREATE INDEX IF NOT EXISTS albums_person_idx ON albums(person_id);
CREATE INDEX IF NOT EXISTS albums_slug_idx   ON albums(slug);

CREATE TABLE IF NOT EXISTS images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id      INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  image_url     TEXT    NOT NULL,
  thumbnail_url TEXT    NOT NULL,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS images_album_idx ON images(album_id, order_index);
