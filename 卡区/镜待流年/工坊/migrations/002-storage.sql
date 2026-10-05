CREATE TABLE IF NOT EXISTS workshop_quota (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  limit_bytes INTEGER NOT NULL CHECK (limit_bytes > 0)
);
INSERT OR IGNORE INTO workshop_quota (id, limit_bytes) VALUES (1, 8000000000);

CREATE TABLE IF NOT EXISTS storage_reservations (
  group_id TEXT PRIMARY KEY,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO storage_reservations (group_id, byte_size)
SELECT a.group_id, SUM(a.byte_size) FROM portrait_assets a
WHERE NOT EXISTS (SELECT 1 FROM storage_reservations r WHERE r.group_id = a.group_id)
GROUP BY a.group_id;

CREATE TRIGGER IF NOT EXISTS reserve_storage_limit
BEFORE INSERT ON storage_reservations
WHEN COALESCE((SELECT SUM(byte_size) FROM storage_reservations), 0) + NEW.byte_size
     > (SELECT limit_bytes FROM workshop_quota WHERE id = 1)
BEGIN
  SELECT RAISE(ABORT, 'workshop_capacity_exceeded');
END;
