-- Unified schema for a single education-level service (SD / SMP / SMA).
-- Combines the former soal-service (tryouts, soal, opsi_jawaban) and
-- jawaban-service (sesi_tryout, jawaban, hasil) into one local database so
-- question management and exam scoring run entirely against the same DB.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Question bank (formerly soal-service / db_soal) ────────────────────────
CREATE TABLE IF NOT EXISTS tryouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_tryout        VARCHAR(255) NOT NULL,
  mata_pelajaran     VARCHAR(100) NOT NULL,
  sub_mata_pelajaran VARCHAR(100),
  kelas              VARCHAR(50),
  durasi_menit       INTEGER NOT NULL DEFAULT 90,
  dibuat_oleh        UUID NOT NULL,
  status             VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- TRN-03: master-data references on pre-existing tryouts tables.
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS sub_mata_pelajaran VARCHAR(100);
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS kelas VARCHAR(50);

CREATE TABLE IF NOT EXISTS soal (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tryout_id       UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  nomor_soal      INTEGER NOT NULL,
  tipe            VARCHAR(20) NOT NULL CHECK (tipe IN ('pilihan_ganda','essay')),
  pertanyaan      TEXT NOT NULL,
  pertanyaan_html TEXT,
  gambar_url      TEXT,
  gambar_base64   TEXT,
  equation        TEXT,
  equation_latex  TEXT,
  panduan_essay   TEXT,
  bobot           INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opsi_jawaban (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soal_id   UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  huruf     CHAR(1) NOT NULL,
  teks      TEXT NOT NULL,
  teks_html TEXT,
  is_benar  BOOLEAN DEFAULT false
);

-- ─── Exam runner & scoring (formerly jawaban-service / db_jawaban) ──────────
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

-- ─── TRN-04: approval workflow + randomization engine ───────────────────────
ALTER TABLE tryouts DROP CONSTRAINT IF EXISTS tryouts_status_check;
ALTER TABLE tryouts ADD CONSTRAINT tryouts_status_check
  CHECK (status IN ('draft','pending_approval','approved','rejected','published','closed'));
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS revision_notes      TEXT;
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS randomize_options   BOOLEAN NOT NULL DEFAULT true;

-- Per-session randomized layout (kept stable across reloads).
ALTER TABLE sesi_tryout ADD COLUMN IF NOT EXISTS question_order UUID[];  -- ordered soal ids
ALTER TABLE sesi_tryout ADD COLUMN IF NOT EXISTS option_order   JSONB;   -- { soal_id: ["C","A","D","B"] }

-- ─── TRN-10: question codes, solutions/explanations, and Super Try Out flag ──
ALTER TABLE soal ADD COLUMN IF NOT EXISTS kode_soal                  VARCHAR(100);
ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian               TEXT;  -- raw markdown/plain text
ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_html          TEXT;  -- rendered HTML (with equations)
ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_gambar_url    TEXT;  -- optional solution image URL
ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_gambar_base64 TEXT;  -- optional solution image (base64)

-- Marks tryouts compiled by an 'admin-soal' from questions across teachers/levels.
ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS is_super_tryout BOOLEAN NOT NULL DEFAULT false;
