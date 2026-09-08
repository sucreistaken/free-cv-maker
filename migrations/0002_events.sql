CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id     TEXT NOT NULL,
  profile_id    TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  event_data    TEXT,
  cv_snapshot   TEXT,
  pdf_r2_key    TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_profile ON events(device_id, profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_feed ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type, created_at DESC);
