CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL,
  code_ciphertext TEXT,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','USED','EXPIRED','RESERVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  reserved_until TIMESTAMPTZ,
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS temporary_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES registration_codes(id),
  payload JSONB NOT NULL,
  pdf BYTEA,
  download_token_hash TEXT UNIQUE,
  agreement_version TEXT,
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(status IN ('PENDING_REVIEW','APPROVED')),
  pdf_downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_registration UUID,
  profile JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED','INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE registration_codes ADD COLUMN IF NOT EXISTS code_ciphertext TEXT;

ALTER TABLE temporary_registrations ADD COLUMN IF NOT EXISTS download_token_hash TEXT UNIQUE;
ALTER TABLE temporary_registrations ADD COLUMN IF NOT EXISTS agreement_version TEXT;
ALTER TABLE temporary_registrations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE temporary_registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING_REVIEW';

UPDATE temporary_registrations SET status='PENDING_REVIEW' WHERE status IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS catalog_source_registration_uq ON catalog_influencers(source_registration) WHERE source_registration IS NOT NULL;

CREATE TABLE IF NOT EXISTS code_attempt_limits (
  device_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS code_attempt_limits_locked_idx ON code_attempt_limits(locked_until);
