CREATE TABLE IF NOT EXISTS workshop_users (
  discord_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at);
CREATE TABLE IF NOT EXISTS workshop_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workshop_sessions_expiry ON workshop_sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_limits_expiry ON login_limits(expires_at);

CREATE TABLE IF NOT EXISTS portrait_group_owners (
  group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
  user_id TEXT NOT NULL REFERENCES workshop_users(discord_id)
);
CREATE INDEX IF NOT EXISTS idx_portrait_owners_user ON portrait_group_owners(user_id);

CREATE TABLE IF NOT EXISTS player_upload_attempts (
  group_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),
  request_key TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  outcome TEXT NOT NULL DEFAULT 'writing' CHECK (outcome IN ('writing', 'complete', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, request_key)
);
CREATE INDEX IF NOT EXISTS idx_player_upload_attempts_user_time ON player_upload_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_player_upload_attempts_time ON player_upload_attempts(created_at);

CREATE TRIGGER IF NOT EXISTS player_upload_limit
BEFORE INSERT ON player_upload_attempts
BEGIN
  SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1
    THEN RAISE(ABORT, 'player_blocked') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 day')) >= 5
    THEN RAISE(ABORT, 'player_daily_limit') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 37748736
    THEN RAISE(ABORT, 'player_daily_limit') END;
  SELECT CASE WHEN EXISTS (SELECT 1 FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 minute'))
    THEN RAISE(ABORT, 'player_rate_limit') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM portrait_groups g JOIN portrait_group_owners o ON o.group_id = g.id
    WHERE o.user_id = NEW.user_id AND g.status = 'pending') +
    (SELECT COUNT(*) FROM player_upload_attempts a WHERE a.user_id = NEW.user_id
    AND a.outcome = 'writing' AND a.created_at >= datetime('now', '-1 hour')
    AND NOT EXISTS (SELECT 1 FROM portrait_groups g WHERE g.id = a.group_id)) >= 3
    THEN RAISE(ABORT, 'player_pending_limit') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts
    WHERE created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 268435456
    THEN RAISE(ABORT, 'player_global_daily_limit') END;
END;
