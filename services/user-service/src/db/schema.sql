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
