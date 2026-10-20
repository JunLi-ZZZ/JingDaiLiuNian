CREATE TABLE IF NOT EXISTS portrait_group_stats (
  group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id) ON DELETE CASCADE,
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_portrait_group_stats_hot ON portrait_group_stats(download_count DESC, use_count DESC);
