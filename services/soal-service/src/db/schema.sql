CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tryouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_tryout    VARCHAR(255) NOT NULL,
  mata_pelajaran VARCHAR(100) NOT NULL,
  durasi_menit   INTEGER NOT NULL DEFAULT 90,
  dibuat_oleh    UUID NOT NULL,
  status         VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

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
