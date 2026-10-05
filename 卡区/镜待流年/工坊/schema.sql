PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS portrait_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'withdrawn')),
  cover_asset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS portrait_assets (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES portrait_groups(id) ON DELETE CASCADE,
  portrait_id TEXT NOT NULL,
  character_name TEXT NOT NULL,
  tag TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'withdrawn')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (group_id, portrait_id)
);

CREATE TABLE IF NOT EXISTS portrait_submissions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES portrait_groups(id),
  submitter_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS moderation_events (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES portrait_submissions(id),
  action TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_portrait_groups_status_id ON portrait_groups(status, id);
CREATE INDEX IF NOT EXISTS idx_portrait_assets_group_status_order ON portrait_assets(group_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_portrait_submissions_status_created ON portrait_submissions(status, created_at);
