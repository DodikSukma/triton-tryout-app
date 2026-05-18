# CLAUDE.md — Triton Denpasar Platform Tryout Online

> Panduan teknis lengkap untuk Claude Code. Baca seluruh file ini sebelum menulis satu baris kode pun.

---

## 1. Identitas Proyek

| Atribut | Detail |
|---|---|
| Nama Proyek | Triton Denpasar — Platform Tryout Online |
| Tipe | Monorepo Microservices (Next.js + Express.js) |
| Bahasa | TypeScript (frontend & backend) |
| Autentikasi | Session-based (express-session + Redis) — **BUKAN JWT** |
| Database | PostgreSQL — setiap service punya database sendiri |
| Tema UI | Biru muda (#60A5FA / #3B82F6) + Merah (#EF4444 / #DC2626) |
| Logo | `public/logo.png` — **selalu gunakan ini, jangan placeholder** |

---

## 2. Struktur Direktori

```
triton-denpasar/
├── CLAUDE.md                    ← file ini
├── docker-compose.yml           ← semua service + Redis + PostgreSQL
├── .env.example
│
├── frontend/                    ← Next.js 14 App Router
│   ├── public/
│   │   └── logo.png             ← LOGO RESMI, selalu pakai ini
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/        ← landing page, login
│   │   │   │   ├── page.tsx     ← landing page
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── (admin)/         ← layout admin, route group
│   │   │   │   └── admin/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── dashboard/page.tsx
│   │   │   │       └── users/page.tsx
│   │   │   ├── (guru)/
│   │   │   │   └── guru/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── dashboard/page.tsx
│   │   │   │       ├── tryout/page.tsx
│   │   │   │       └── tryout/[id]/soal/page.tsx
│   │   │   └── (siswa)/
│   │   │       └── siswa/
│   │   │           ├── layout.tsx
│   │   │           ├── dashboard/page.tsx
│   │   │           └── tryout/[id]/page.tsx
│   │   ├── components/
│   │   │   ├── ui/              ← shadcn/ui components
│   │   │   ├── layout/          ← Navbar, Sidebar, Footer
│   │   │   └── shared/          ← Logo, Avatar, RoleGuard
│   │   ├── lib/
│   │   │   ├── api.ts           ← axios instance + interceptors
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts         ← semua TypeScript types
│   ├── tailwind.config.ts
│   └── package.json
│
├── services/
│   ├── api-gateway/             ← Express.js, port 3000
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts   ← validasi session ke auth-service
│   │   │   │   └── proxy.middleware.ts  ← http-proxy-middleware
│   │   │   └── routes/
│   │   │       └── index.ts
│   │   └── package.json
│   │
│   ├── auth-service/            ← Express.js, port 3001
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.ts
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── middleware/
│   │   │   │   └── session.middleware.ts
│   │   │   └── db/
│   │   │       ├── schema.sql
│   │   │       └── pool.ts
│   │   └── package.json
│   │
│   ├── user-service/            ← Express.js, port 3002
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── db/
│   │   │       └── schema.sql
│   │   └── package.json
│   │
│   ├── soal-service/            ← Express.js, port 3003
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── db/
│   │   │       └── schema.sql
│   │   └── package.json
│   │
│   └── jawaban-service/         ← Express.js, port 3004
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   ├── controllers/
│       │   └── db/
│       │       └── schema.sql
│       └── package.json
```

---

## 3. Tema & Design System

### Palet Warna (wajib konsisten)

```ts
// tailwind.config.ts — extend colors
colors: {
  triton: {
    blue: {
      50:  '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',   // ← primary blue muda
      500: '#3B82F6',   // ← blue utama
      600: '#2563EB',
      700: '#1D4ED8',
    },
    red: {
      400: '#F87171',
      500: '#EF4444',   // ← primary red
      600: '#DC2626',   // ← red utama / CTA penting
      700: '#B91C1C',
    },
    neutral: {
      50:  '#F8FAFC',
      100: '#F1F5F9',
      800: '#1E293B',
      900: '#0F172A',
    }
  }
}
```

### Tipografi

```ts
// next/font — gunakan ini
import { Plus_Jakarta_Sans } from 'next/font/google'
// heading: font-bold, text-triton-blue-700 atau text-triton-red-600
// body: font-normal, text-slate-700
// label form: font-medium, text-slate-600
```

### Logo

```tsx
// SELALU gunakan logo.png dari public folder
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Triton Denpasar"
  width={140}
  height={48}
  priority
/>
```

**DILARANG**: menggunakan placeholder, text "Logo", SVG buatan sendiri sebagai pengganti logo.

---

## 4. Arsitektur Microservices

### Port Map

| Service | Port | Database |
|---|---|---|
| Frontend (Next.js) | 3000 (dev) | — |
| API Gateway | 4000 | — |
| Auth Service | 4001 | `db_auth` (PostgreSQL) |
| User Service | 4002 | `db_user` (PostgreSQL) |
| Soal Service | 4003 | `db_soal` (PostgreSQL) |
| Jawaban Service | 4004 | `db_jawaban` (PostgreSQL) |
| Redis | 6379 | — |
| PostgreSQL | 5432 | multi-database |

### Alur Request

```
Browser → Next.js (fetch/axios) → API Gateway (port 4000)
                                        ↓
                              Auth Middleware: GET /auth/me
                                        ↓ valid session
                              Proxy ke service yang sesuai
                                        ↓
                              Service query DB sendiri
                                        ↓
                              Response kembali ke browser
```

### Session Flow (Auth)

```
1. POST /auth/login         → validasi email+password (bcrypt)
2. Buat session di Redis    → key: sess:{sessionId}, value: {userId, role, name}
3. Set-Cookie: triton.sid   → HttpOnly, Secure, SameSite=Lax, maxAge=8h
4. Setiap request berikut   → cookie dikirim otomatis oleh browser
5. API Gateway              → forward cookie ke Auth Service GET /auth/me
6. Auth Service             → lookup Redis → return {userId, role}
7. Gateway inject header    → X-User-Id, X-User-Role ke downstream service
8. POST /auth/logout        → destroy session di Redis, clear cookie
```

---

## 5. Database Schema

### auth-service — `db_auth`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### user-service — `db_user`

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL,   -- ref ke auth.users.id
  nama_lengkap VARCHAR(255) NOT NULL,
  no_telepon  VARCHAR(20),
  kelas       VARCHAR(50),            -- khusus siswa
  mata_pelajaran VARCHAR(255),        -- khusus guru (JSON array string)
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### soal-service — `db_soal`

```sql
CREATE TABLE tryouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_tryout  VARCHAR(255) NOT NULL,
  mata_pelajaran VARCHAR(100) NOT NULL,
  durasi_menit INTEGER NOT NULL DEFAULT 90,
  dibuat_oleh  UUID NOT NULL,          -- guru user_id
  status       VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE soal (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tryout_id    UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
  nomor_soal   INTEGER NOT NULL,
  tipe         VARCHAR(20) NOT NULL CHECK (tipe IN ('pilihan_ganda','essay')),
  pertanyaan   TEXT NOT NULL,
  gambar_url   TEXT,                   -- opsional, URL gambar soal
  equation     TEXT,                   -- opsional, LaTeX string
  bobot        INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opsi_jawaban (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soal_id   UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  huruf     CHAR(1) NOT NULL,          -- A, B, C, D, E
  teks      TEXT NOT NULL,
  is_benar  BOOLEAN DEFAULT false
);
```

### jawaban-service — `db_jawaban`

```sql
CREATE TABLE sesi_tryout (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id    UUID NOT NULL,
  tryout_id   UUID NOT NULL,
  mulai_at    TIMESTAMPTZ DEFAULT NOW(),
  selesai_at  TIMESTAMPTZ,
  status      VARCHAR(20) DEFAULT 'berlangsung' CHECK (status IN ('berlangsung','selesai','timeout')),
  UNIQUE(siswa_id, tryout_id)
);

CREATE TABLE jawaban (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id         UUID NOT NULL REFERENCES sesi_tryout(id),
  soal_id         UUID NOT NULL,
  jawaban_teks    TEXT,                -- untuk essay
  opsi_id         UUID,               -- untuk pilihan ganda
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sesi_id, soal_id)
);

CREATE TABLE hasil (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id     UUID UNIQUE NOT NULL REFERENCES sesi_tryout(id),
  siswa_id    UUID NOT NULL,
  tryout_id   UUID NOT NULL,
  total_benar INTEGER DEFAULT 0,
  total_soal  INTEGER NOT NULL,
  nilai       NUMERIC(5,2),
  dihitung_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API Endpoints

### Auth Service (port 4001)

```
POST   /auth/login          → body: {email, password}
POST   /auth/logout         → hapus session
GET    /auth/me             → return {userId, role, name} dari session
POST   /auth/change-password → body: {oldPassword, newPassword}
```

### User Service (port 4002) — via Gateway

```
GET    /users               → [ADMIN] list semua user
POST   /users               → [ADMIN] buat user baru
GET    /users/:id           → [ADMIN/diri sendiri] detail user
PUT    /users/:id           → [ADMIN] update user
DELETE /users/:id           → [ADMIN] soft-delete (is_active=false)
GET    /users/profile/me    → profil diri sendiri
PUT    /users/profile/me    → update profil sendiri
```

### Soal Service (port 4003) — via Gateway

```
GET    /tryouts             → [GURU] list tryout milik guru ini
POST   /tryouts             → [GURU] buat tryout baru
GET    /tryouts/:id         → detail tryout + soal-soalnya
PUT    /tryouts/:id         → [GURU] edit tryout
PATCH  /tryouts/:id/publish → [GURU] publish tryout
DELETE /tryouts/:id         → [GURU] hapus tryout (soft delete)

POST   /tryouts/:id/soal    → [GURU] tambah soal
PUT    /soal/:soalId        → [GURU] edit soal
DELETE /soal/:soalId        → [GURU] hapus soal

GET    /tryouts/available   → [SISWA] list tryout yang sudah published
```

### Jawaban Service (port 4004) — via Gateway

```
POST   /sesi                → [SISWA] mulai sesi tryout
GET    /sesi/:sesiId        → [SISWA] status sesi aktif
POST   /sesi/:sesiId/jawab  → [SISWA] submit jawaban 1 soal
POST   /sesi/:sesiId/selesai → [SISWA] akhiri sesi + hitung nilai
GET    /hasil/:tryoutId     → [SISWA] hasil tryout diri sendiri
GET    /hasil/rekap/:tryoutId → [GURU] rekap semua hasil siswa
```

---

## 7. Environment Variables

### Root `.env` (di-share ke semua service via docker-compose)

```env
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=triton_user
POSTGRES_PASSWORD=triton_secret_2024

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Session
SESSION_SECRET=triton_session_super_secret_2024_ganti_ini
SESSION_MAX_AGE_MS=28800000   # 8 jam

# Service URLs (internal docker network)
AUTH_SERVICE_URL=http://auth-service:4001
USER_SERVICE_URL=http://user-service:4002
SOAL_SERVICE_URL=http://soal-service:4003
JAWABAN_SERVICE_URL=http://jawaban-service:4004

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 8. Rules Pengembangan

### Wajib diikuti

1. **TypeScript strict mode** — tidak ada `any` kecuali terpaksa dan diberi komentar alasan
2. **Logo selalu `/logo.png`** — tidak boleh diganti atau dihilangkan di mana pun
3. **Tema warna** — hanya gunakan palet triton-blue dan triton-red di atas
4. **Session bukan JWT** — jangan sekali-kali menggunakan `jsonwebtoken` package
5. **Error handling** — setiap route Express wajib punya try-catch dan kirim JSON error
6. **Validasi input** — gunakan `zod` untuk validasi body request di semua service
7. **Setiap service independen** — tidak boleh import module dari service lain secara langsung

### Konvensi Kode

```ts
// Naming
PascalCase     → React components, TypeScript types/interfaces
camelCase      → variabel, fungsi, method
kebab-case     → nama file, folder
SCREAMING_CASE → konstanta env

// Import order
1. Node built-ins
2. External packages
3. Internal absolute (@/...)
4. Relative (./, ../)

// Response format API (konsisten)
// Success:
{ success: true, data: {...}, message?: string }
// Error:
{ success: false, error: string, code?: string }
```

### Middleware Auth di API Gateway

```ts
// Setiap route yang butuh autentikasi wajib pakai ini
// File: services/api-gateway/src/middleware/auth.middleware.ts

export async function requireAuth(req, res, next) {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { cookie: req.headers.cookie || '' }
    })
    if (!response.ok) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const { data } = await response.json()
    req.headers['x-user-id']   = data.userId
    req.headers['x-user-role'] = data.role
    next()
  } catch {
    res.status(503).json({ success: false, error: 'Auth service unavailable' })
  }
}

export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.headers['x-user-role'])) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    next()
  }
}
```

---

## 9. Komponen Frontend Wajib

### Navbar (semua halaman publik)

- Logo kiri (`/logo.png`)
- Menu: Beranda, Tentang, Kontak
- Tombol "Masuk" → merah (`bg-triton-red-500`)

### Sidebar Dashboard (semua role)

- Logo di atas (`/logo.png`, ukuran kecil)
- Menu navigasi sesuai role
- Avatar + nama user di bawah
- Warna: biru muda background, aksen merah untuk item aktif

### Halaman Login

- Split layout: kiri ilustrasi/branding (biru), kanan form
- Logo besar di bagian kiri
- Dropdown pilih role (admin/guru/siswa) yang mengubah warna aksen form
- Tombol submit: merah

### Guard Component

```tsx
// src/components/shared/RoleGuard.tsx
// Wrap halaman dengan ini, redirect kalau role tidak sesuai
```

---

## 10. Docker Compose (ringkasan)

```yaml
services:
  postgres:     image: postgres:16-alpine
  redis:        image: redis:7-alpine
  api-gateway:  build: ./services/api-gateway,   port 4000:4000
  auth-service: build: ./services/auth-service,  port 4001:4001
  user-service: build: ./services/user-service,  port 4002:4002
  soal-service: build: ./services/soal-service,  port 4003:4003
  jawaban-service: build: ./services/jawaban-service, port 4004:4004
  frontend:     build: ./frontend,               port 3000:3000
```

---

## 11. Urutan Build (jalankan sesuai urutan ini)

1. `docker-compose up postgres redis -d`
2. Jalankan semua `schema.sql` di masing-masing database
3. `docker-compose up auth-service user-service soal-service jawaban-service -d`
4. `docker-compose up api-gateway -d`
5. `cd frontend && npm run dev`
6. Seed data: 1 admin, 2 guru, 5 siswa

---

*CLAUDE.md ini adalah sumber kebenaran tunggal. Jika ada konflik antara file ini dan kode yang ada, file ini yang benar.*
