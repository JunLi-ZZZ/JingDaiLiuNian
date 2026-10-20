CREATE TABLE IF NOT EXISTS portrait_append_revisions (
  group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id)
);

DROP TRIGGER IF EXISTS portrait_revision_publish;
CREATE TRIGGER portrait_revision_publish
AFTER UPDATE OF status ON portrait_groups
WHEN NEW.status = 'published' AND OLD.status <> 'published'
  AND NOT EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
BEGIN
  UPDATE portrait_groups SET status = 'withdrawn', published_at = NULL
    WHERE id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  UPDATE portrait_assets SET status = 'withdrawn'
    WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now')
    WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  INSERT INTO moderation_events (id, submission_id, action, note)
    SELECT lower(hex(randomblob(16))), s.id, 'replaced', NEW.id FROM portrait_submissions s
    JOIN portrait_group_revisions r ON r.source_group_id = s.group_id WHERE r.group_id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS portrait_append_publish_check
BEFORE UPDATE OF status ON portrait_groups
WHEN NEW.status = 'published' AND OLD.status <> 'published'
  AND EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
BEGIN
  SELECT CASE WHEN (SELECT status FROM portrait_groups WHERE id =
    (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)) <> 'published'
    THEN RAISE(ABORT, 'revision_source_unavailable') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM portrait_assets old JOIN portrait_assets added ON old.portrait_id = added.portrait_id
    WHERE old.group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)
      AND added.group_id = NEW.id
  ) THEN RAISE(ABORT, 'portrait_id_conflict') END;
END;

CREATE TRIGGER IF NOT EXISTS portrait_append_publish
AFTER UPDATE OF status ON portrait_groups
WHEN NEW.status = 'published' AND OLD.status <> 'published'
  AND EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
BEGIN
  UPDATE portrait_assets SET sort_order = sort_order +
    (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM portrait_assets WHERE group_id =
      (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id))
    WHERE group_id = NEW.id;
  UPDATE portrait_groups SET cover_asset_id =
    (SELECT cover_asset_id FROM portrait_groups WHERE id =
      (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id))
    WHERE id = NEW.id;
  UPDATE portrait_assets SET group_id = NEW.id, status = 'published'
    WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  UPDATE storage_reservations SET byte_size = byte_size + COALESCE((SELECT byte_size FROM storage_reservations
    WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)), 0)
    WHERE group_id = NEW.id;
  DELETE FROM storage_reservations WHERE group_id =
    (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  UPDATE portrait_groups SET status = 'withdrawn', published_at = NULL, cover_asset_id = NULL
    WHERE id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now')
    WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
  INSERT INTO moderation_events (id, submission_id, action, note)
    SELECT lower(hex(randomblob(16))), s.id, 'appended', NEW.id FROM portrait_submissions s
    JOIN portrait_group_revisions r ON r.source_group_id = s.group_id WHERE r.group_id = NEW.id;
END;
