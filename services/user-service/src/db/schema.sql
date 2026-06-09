CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL,
  nama_lengkap   VARCHAR(255) NOT NULL,
  no_telepon     VARCHAR(20),
  kelas          VARCHAR(50),
  mata_pelajaran VARCHAR(255),
  avatar_url     TEXT,
  bio            TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TRN-04: explicit education level for student level-scoping (gateway firewall).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level VARCHAR(10)
  CHECK (education_level IN ('SD', 'SMP', 'SMA'));

-- ─── Master data registry (TRN-03) ──────────────────────────────────────────
-- Administered by admins; read by gurus to populate the tryout creation cascade.
CREATE TABLE IF NOT EXISTS master_kelas (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama  VARCHAR(50) UNIQUE NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA'))
);

CREATE TABLE IF NOT EXISTS master_mata_pelajaran (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama  VARCHAR(100) UNIQUE NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA'))
);

CREATE TABLE IF NOT EXISTS master_sub_mata_pelajaran (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_pelajaran_id UUID NOT NULL REFERENCES master_mata_pelajaran(id) ON DELETE CASCADE,
  nama              VARCHAR(100) NOT NULL,
  UNIQUE(mata_pelajaran_id, nama)
);

-- ─── Audit logs (TRN-06): platform-wide activity trail ──────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,                  -- references db_auth.users(id); null for failed logins
  email       VARCHAR(255) NOT NULL, -- actor email
  role        VARCHAR(20) NOT NULL,  -- admin | guru | siswa | system
  action      VARCHAR(100) NOT NULL, -- e.g. AUTH_LOGIN_SUCCESS, TRYOUT_PUBLISH
  target_id   UUID,                  -- affected entity (user/tryout/session)
  description TEXT NOT NULL,
  ip_address  VARCHAR(50),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email);
