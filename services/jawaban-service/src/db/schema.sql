CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sesi_tryout (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id   UUID NOT NULL,
  tryout_id  UUID NOT NULL,
  mulai_at   TIMESTAMPTZ DEFAULT NOW(),
  selesai_at TIMESTAMPTZ,
  status     VARCHAR(20) DEFAULT 'berlangsung' CHECK (status IN ('berlangsung','selesai','timeout')),
  UNIQUE(siswa_id, tryout_id)
);

CREATE TABLE IF NOT EXISTS jawaban (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id      UUID NOT NULL REFERENCES sesi_tryout(id),
  soal_id      UUID NOT NULL,
  jawaban_teks TEXT,
  opsi_id      UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sesi_id, soal_id)
);

CREATE TABLE IF NOT EXISTS hasil (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id     UUID UNIQUE NOT NULL REFERENCES sesi_tryout(id),
  siswa_id    UUID NOT NULL,
  tryout_id   UUID NOT NULL,
  total_benar INTEGER DEFAULT 0,
  total_soal  INTEGER NOT NULL,
  nilai       NUMERIC(5,2),
  dihitung_at TIMESTAMPTZ DEFAULT NOW()
);
