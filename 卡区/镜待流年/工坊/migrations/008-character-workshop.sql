CREATE TABLE IF NOT EXISTS character_workshop_quota (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  limit_bytes INTEGER NOT NULL CHECK (limit_bytes > 0)
);
INSERT OR IGNORE INTO character_workshop_quota VALUES (1, 67108864);

CREATE TABLE IF NOT EXISTS character_packages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),
  request_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'withdrawn')),
  payload TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 262144),
  entry_count INTEGER NOT NULL CHECK (entry_count BETWEEN 1 AND 32),
  portrait_group_id TEXT,
  source_id TEXT REFERENCES character_packages(id),
  source_status TEXT,
  family_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE (user_id, request_key)
);
CREATE INDEX IF NOT EXISTS idx_character_packages_public ON character_packages(status, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_character_packages_author ON character_packages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_packages_source ON character_packages(source_id, status);

CREATE TABLE IF NOT EXISTS character_moderation_events (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES character_packages(id),
  action TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS character_submission_limits
BEFORE INSERT ON character_packages
BEGIN
  SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1
    THEN RAISE(ABORT, 'player_blocked') END;
  SELECT CASE WHEN EXISTS (SELECT 1 FROM character_packages WHERE user_id = NEW.user_id AND created_at >= datetime('now', '-1 minute'))
    THEN RAISE(ABORT, 'player_rate_limit') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE user_id = NEW.user_id AND created_at >= datetime('now', '-1 day')) >= 5
    THEN RAISE(ABORT, 'player_daily_limit') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE user_id = NEW.user_id AND status = 'pending') >= 3
    THEN RAISE(ABORT, 'player_pending_limit') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE created_at >= datetime('now', '-1 day')) >= 200
    THEN RAISE(ABORT, 'player_global_daily_limit') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM character_packages), 0) + NEW.byte_size > (SELECT limit_bytes FROM character_workshop_quota WHERE id = 1)
    THEN RAISE(ABORT, 'workshop_capacity_exceeded') END;
  SELECT CASE WHEN NEW.source_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM character_packages WHERE id = NEW.source_id AND user_id = NEW.user_id AND status IN ('published', 'withdrawn', 'rejected'))
    THEN RAISE(ABORT, 'revision_source_unavailable') END;
  SELECT CASE WHEN NEW.source_id IS NOT NULL AND EXISTS (SELECT 1 FROM character_packages WHERE source_id = NEW.source_id AND status IN ('pending', 'published'))
    THEN RAISE(ABORT, 'revision_already_exists') END;
END;

CREATE TRIGGER IF NOT EXISTS character_revision_publish_check
BEFORE UPDATE OF status ON character_packages
WHEN NEW.status = 'published' AND OLD.status <> 'published'
BEGIN
  SELECT CASE WHEN EXISTS (SELECT 1 FROM character_packages WHERE source_id = NEW.id AND status = 'published')
    THEN RAISE(ABORT, 'revision_superseded') END;
  SELECT CASE WHEN NEW.source_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM character_packages WHERE id = NEW.source_id AND user_id = NEW.user_id AND status = NEW.source_status)
    THEN RAISE(ABORT, 'revision_source_unavailable') END;
END;

CREATE TRIGGER IF NOT EXISTS character_revision_publish
AFTER UPDATE OF status ON character_packages
WHEN NEW.status = 'published' AND OLD.status <> 'published' AND NEW.source_id IS NOT NULL
BEGIN
  UPDATE character_packages SET status = 'withdrawn', published_at = NULL WHERE id = NEW.source_id;
  INSERT INTO character_moderation_events (id, package_id, action, note)
    VALUES (lower(hex(randomblob(16))), NEW.source_id, 'superseded', NEW.id);
END;
