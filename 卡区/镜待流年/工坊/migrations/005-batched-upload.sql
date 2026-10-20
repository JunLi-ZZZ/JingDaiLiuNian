CREATE TABLE IF NOT EXISTS portrait_upload_drafts (
  group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
  manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TRIGGER IF EXISTS player_upload_limit;
CREATE TRIGGER player_upload_limit
BEFORE INSERT ON player_upload_attempts
BEGIN
  SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1
    THEN RAISE(ABORT, 'player_blocked') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 day')) >= 5
    THEN RAISE(ABORT, 'player_daily_limit') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 2147483648
    THEN RAISE(ABORT, 'player_daily_limit') END;
  SELECT CASE WHEN EXISTS (SELECT 1 FROM player_upload_attempts WHERE user_id = NEW.user_id
    AND created_at >= datetime('now', '-1 minute'))
    THEN RAISE(ABORT, 'player_rate_limit') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM portrait_groups g JOIN portrait_group_owners o ON o.group_id = g.id
    WHERE o.user_id = NEW.user_id AND g.status = 'pending') +
    (SELECT COUNT(*) FROM player_upload_attempts a WHERE a.user_id = NEW.user_id
    AND a.outcome = 'writing' AND a.created_at >= datetime('now', '-1 hour')) >= 3
    THEN RAISE(ABORT, 'player_pending_limit') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts
    WHERE created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 4294967296
    THEN RAISE(ABORT, 'player_global_daily_limit') END;
END;

CREATE TRIGGER IF NOT EXISTS portrait_draft_finalize
BEFORE UPDATE OF status ON portrait_groups
WHEN OLD.status = 'draft' AND NEW.status = 'pending'
BEGIN
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM portrait_upload_drafts WHERE group_id = NEW.id)
    OR (SELECT COUNT(*) FROM portrait_assets WHERE group_id = NEW.id) <
       json_array_length((SELECT manifest_json FROM portrait_upload_drafts WHERE group_id = NEW.id))
    THEN RAISE(ABORT, 'upload_incomplete') END;
END;
