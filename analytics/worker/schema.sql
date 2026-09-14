-- Analytics store. One row per event; aggregation happens at read time
-- because the volumes here are a personal portfolio's, not a product's,
-- and keeping raw rows means a new question can be asked of old traffic
-- without having had the foresight to pre-aggregate it.

CREATE TABLE IF NOT EXISTS events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ts             TEXT NOT NULL,   -- ISO8601 UTC, full precision
  day            TEXT NOT NULL,   -- YYYY-MM-DD (UTC), denormalised for grouping
  kind           TEXT NOT NULL,   -- 'pageview' | 'download' | 'resume_build' | ...
  path           TEXT NOT NULL,   -- same-origin path only, no query string
  referrer_host  TEXT,            -- host only: a full referrer URL can carry
                                  -- someone's search terms or an ATS token
  country        TEXT,            -- two-letter, from Cloudflare's own header
  visitor        TEXT NOT NULL,   -- daily-rotating hash; see worker.js
  meta           TEXT             -- JSON, event-specific (e.g. which role was picked)
);

-- Every dashboard query filters on day, then usually groups by one other
-- column. These three cover all of them.
CREATE INDEX IF NOT EXISTS idx_events_day       ON events (day);
CREATE INDEX IF NOT EXISTS idx_events_kind_day  ON events (kind, day);
CREATE INDEX IF NOT EXISTS idx_events_path_day  ON events (path, day);
