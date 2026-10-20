ALTER TABLE character_packages ADD COLUMN category TEXT NOT NULL DEFAULT 'character' CHECK (category IN ('character', 'plane', 'other'));
CREATE INDEX IF NOT EXISTS idx_character_packages_category ON character_packages(status, category, published_at DESC, id DESC);
