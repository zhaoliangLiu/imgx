CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  path TEXT NOT NULL,
  mime TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_sha256 ON images(sha256);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  task TEXT NOT NULL,
  prompt TEXT,
  model TEXT NOT NULL,
  base_url TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  result_text TEXT,
  result_json TEXT,
  raw_response TEXT,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(image_id) REFERENCES images(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_cache_key ON analyses(cache_key);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  analysis_id TEXT,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(analysis_id) REFERENCES analyses(id)
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  input_pattern TEXT NOT NULL,
  status TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  succeeded INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS batch_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  status TEXT NOT NULL,
  analysis_id TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(analysis_id) REFERENCES analyses(id)
);

CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

