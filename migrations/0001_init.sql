CREATE TABLE IF NOT EXISTS cv_snapshots (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id          TEXT NOT NULL,
  profile_id         TEXT NOT NULL,
  profile_name       TEXT NOT NULL DEFAULT '',
  full_name          TEXT,
  cv_data            TEXT NOT NULL,
  cover_letter_data  TEXT,
  template           TEXT NOT NULL DEFAULT 'classic',
  theme              TEXT,
  language           TEXT NOT NULL DEFAULT 'tr',
  user_agent         TEXT,
  first_seen_at      TEXT NOT NULL,
  last_synced_at     TEXT NOT NULL,
  sync_count         INTEGER NOT NULL DEFAULT 1,
  UNIQUE (device_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_cv_snapshots_last_synced ON cv_snapshots(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_snapshots_template ON cv_snapshots(template);
CREATE INDEX IF NOT EXISTS idx_cv_snapshots_language ON cv_snapshots(language);
