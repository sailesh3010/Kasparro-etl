-- CREATE RAW TABLES
CREATE TABLE IF NOT EXISTS raw_api (
  id SERIAL PRIMARY KEY,
  source_id TEXT,
  payload JSONB,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_csv (
  id SERIAL PRIMARY KEY,
  source_id TEXT,
  payload JSONB,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_rss (
  id SERIAL PRIMARY KEY,
  source_id TEXT,
  payload JSONB,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NORMALIZED table (unified schema example)
CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  UNIQUE(source, source_id)
);

-- Checkpoints (per-source)
CREATE TABLE IF NOT EXISTS checkpoints (
  source TEXT PRIMARY KEY,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_external_id TEXT
);

-- Run metadata for stats & resume
CREATE TABLE IF NOT EXISTS etl_runs (
  id UUID PRIMARY KEY,
  source TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  processed_count INTEGER DEFAULT 0,
  error TEXT
);
