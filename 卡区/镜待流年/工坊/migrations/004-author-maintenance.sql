CREATE TABLE IF NOT EXISTS portrait_group_revisions (
  group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
  source_group_id TEXT NOT NULL REFERENCES portrait_groups(id),
  source_status TEXT NOT NULL,
  CHECK (group_id <> source_group_id)
);
CREATE INDEX IF NOT EXISTS idx_portrait_revisions_source ON portrait_group_revisions(source_group_id);

CREATE TRIGGER IF NOT EXISTS portrait_revision_insert
BEFORE INSERT ON portrait_group_revisions
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM portrait_groups g
    JOIN portrait_group_owners old_owner ON old_owner.group_id = g.id
    JOIN portrait_group_owners new_owner ON new_owner.group_id = NEW.group_id
    WHERE g.id = NEW.source_group_id AND g.status = NEW.source_status AND g.status <> 'draft'
      AND old_owner.user_id = new_owner.user_id
      AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = g.id)
  ) THEN RAISE(ABORT, 'revision_source_unavailable') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.group_id
    WHERE r.source_group_id = NEW.source_group_id AND g.status IN ('pending', 'published')
  ) THEN RAISE(ABORT, 'revision_already_exists') END;
END;

CREATE TRIGGER IF NOT EXISTS portrait_revision_publish_check
BEFORE UPDATE OF status ON portrait_groups
WHEN NEW.status = 'published' AND OLD.status <> 'published'
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.group_id
    WHERE r.source_group_id = NEW.id AND g.status = 'published'
  ) THEN RAISE(ABORT, 'revision_superseded') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.source_group_id
    WHERE r.group_id = NEW.id AND (g.status <> r.source_status
      OR NOT EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = g.id))
  ) THEN RAISE(ABORT, 'revision_source_unavailable') END;
END;

CREATE TRIGGER IF NOT EXISTS portrait_revision_publish
AFTER UPDATE OF status ON portrait_groups
WHEN NEW.status = 'published' AND OLD.status <> 'published'
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
