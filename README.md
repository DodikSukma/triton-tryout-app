# 🎓 Triton Denpasar — Platform Tryout Online

Platform tryout online terintegrasi untuk **Triton Denpasar**.  
Dibangun dengan arsitektur **Microservices** — Next.js 14 di frontend, Express.js di backend, PostgreSQL + Redis untuk data.

---

## 📋 Daftar Isi

1. [Prerequisites](#-prerequisites)
2. [Struktur Proyek](#-struktur-proyek)
3. [Port Map](#-port-map)
4. [Setup dari Nol](#-setup-dari-nol)
   - [1. Clone Repository](#1-clone-repository)
   - [2. Setup File .env](#2-setup-file-env)
   - [3. Jalankan Docker](#3-jalankan-docker-postgresql--redis)
   - [4. Buat 4 Database](#4-buat-4-database)
   - [5. Jalankan Schema Migration](#5-jalankan-schema-migration)
   - [6. Install Dependencies](#6-install-dependencies)
   - [7. Seed Data Awal](#7-seed-data-awal)
   - [8. Jalankan Backend](#8-jalankan-backend-services)
   - [9. Jalankan Frontend](#9-jalankan-frontend)
   - [10. Verifikasi](#10-verifikasi)
5. [Akun Default](#-akun-default)
6. [Referensi Perintah Make](#-referensi-perintah-make)
7. [Troubleshooting](#-troubleshooting)
8. [Cara Stop Semua Service](#-cara-stop-semua-service)

---

## ✅ Prerequisites

Pastikan semua tools berikut sudah terinstall sebelum mulai:

| Tool | Versi Minimum | Cek Versi | Install |
|------|--------------|-----------|---------|
| **Node.js** | 18.x | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x | `npm -v` | Ikut Node.js |
| **Docker** | 20.x | `docker -v` | [docker.com](https://www.docker.com/get-started) |
| **Docker Compose** | 2.x | `docker compose version` | Sudah bundled dengan Docker Desktop |
| **Make** | any | `make -v` | macOS: sudah ada / Linux: `sudo apt install make` |

> **Windows?** Gunakan **WSL 2** (Windows Subsystem for Linux). Jalankan semua perintah di dalam WSL terminal, bukan Command Prompt atau PowerShell biasa.

---

## 📂 Struktur Proyek

```
tritonapp/
├── frontend/                   # Next.js 14 App Router (port 3000)
│   ├── src/app/                # Halaman dan layout
│   ├── src/components/         # Komponen UI
│   └── public/                 # Aset statis (logo.png, dll)
│
├── services/
│   ├── api-gateway/            # Reverse proxy & auth middleware (port 4000)
│   ├── auth-service/           # Login, logout, session (port 4001)
│   ├── user-service/           # Manajemen user & profil (port 4002)
│   ├── soal-service/           # Tryout & soal (port 4003)
│   └── jawaban-service/        # Jawaban, sesi ujian, scoring (port 4004)
│
├── scripts/
│   ├── seed.ts                 # Script untuk isi data awal
│   ├── dev.sh                  # Script jalankan semua service (dev)
│   ├── start.sh                # Script jalankan production build
│   └── stop.sh                 # Script hentikan semua service
│
├── logs/                       # Log output per service (auto-generated)
├── .env                        # Environment variables (WAJIB ada)
├── docker-compose.yml          # Konfigurasi PostgreSQL + Redis
├── Makefile                    # Semua perintah make
└── README.md
```

---

## 🔌 Port Map

| Service | Port | Database | Keterangan |
|---------|------|----------|------------|
| Frontend | **3000** | — | Next.js dev server |
| API Gateway | **4000** | — | Entry point semua request dari browser |
| Auth Service | **4001** | db_auth | Login, logout, cek session |
| User Service | **4002** | db_user | Profil pengguna, kelola user |
| Soal Service | **4003** | db_soal | Tryout, soal, opsi jawaban |
| Jawaban Service | **4004** | db_jawaban | Sesi ujian, jawaban, nilai |
| PostgreSQL | **5432** | — | Database engine |
| Redis | **6379** | — | Session store |

---

## 🚀 Setup dari Nol

> Ikuti langkah-langkah ini **secara berurutan**. Jangan skip.

---

### 1. Clone Repository

```bash
git clone https://github.com/DodikSukma/triton-tryout-app.git
cd triton-tryout-app
```

---

### 2. Setup File `.env`

File `.env` sudah tersedia di root project. Isi defaultnya sudah cocok untuk development lokal, **tidak perlu diubah** kecuali setup kamu berbeda.

Isi file `.env`:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=triton_user
POSTGRES_PASSWORD=triton_secret_2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Session
SESSION_SECRET=triton_session_super_secret_2024_change_this
SESSION_MAX_AGE_MS=28800000

# Internal service URLs
AUTH_SERVICE_URL=http://localhost:4001
USER_SERVICE_URL=http://localhost:4002
SOAL_SERVICE_URL=http://localhost:4003
JAWABAN_SERVICE_URL=http://localhost:4004

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Jangan commit file `.env` ke Git.** File ini sudah ada di `.gitignore`.

---

### 3. Jalankan Docker (PostgreSQL + Redis)

Jalankan PostgreSQL dan Redis menggunakan Docker Compose:

```bash
docker compose up -d postgres redis
```

Cek apakah container sudah berjalan:

```bash
docker ps
```

Kamu harus melihat dua container: `triton-postgres` dan `triton-redis`.

> Kalau error **port 5432 already in use**, artinya kamu punya PostgreSQL lokal yang sedang berjalan. Hentikan dulu: `sudo systemctl stop postgresql` (Linux) atau hentikan via pgAdmin/Postgres.app (macOS).

---

### 4. Buat 4 Database

Proyek ini menggunakan **4 database terpisah** — satu per service. Jalankan perintah berikut satu per satu:

```bash
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_auth;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_user;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_soal;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_jawaban;"
```

Verifikasi database sudah terbuat:

```bash
docker exec -it triton-postgres psql -U triton_user -c "\l"
```

Kamu harus melihat `db_auth`, `db_user`, `db_soal`, `db_jawaban` di daftar.

---

### 5. Jalankan Schema Migration

Buat semua tabel di masing-masing database dengan menjalankan file SQL schema:

```bash
docker exec -i triton-postgres psql -U triton_user -d db_auth    < services/auth-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_user    < services/user-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_soal    < services/soal-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_jawaban < services/jawaban-service/src/db/schema.sql
```

> **Catatan:** Gunakan `-i` (bukan `-it`) saat meneruskan file dengan `<`.

Verifikasi tabel sudah terbuat (contoh untuk db_auth):

```bash
docker exec -it triton-postgres psql -U triton_user -d db_auth -c "\dt"
```

---

### 6. Install Dependencies

Install semua npm dependencies untuk seluruh service sekaligus:

```bash
make install
```

Perintah ini akan install dependencies untuk:
- `services/auth-service`
- `services/user-service`
- `services/soal-service`
- `services/jawaban-service`
- `services/api-gateway`
- `frontend`
- `scripts`

> Proses ini bisa memakan waktu 2–5 menit tergantung koneksi internet.

---

### 7. Seed Data Awal

Isi database dengan akun-akun default untuk testing:

```bash
make seed
```

Output yang diharapkan:

```
Seeding users...
  ✓ admin@triton.id (admin)
  ✓ guru1@triton.id (guru)
  ✓ guru2@triton.id (guru)
  ✓ siswa1@triton.id (siswa)
  ✓ siswa2@triton.id (siswa)
  ✓ siswa3@triton.id (siswa)
  ✓ siswa4@triton.id (siswa)
  ✓ siswa5@triton.id (siswa)
Seeding selesai!
```

> Seed aman dijalankan berulang kali — menggunakan `ON CONFLICT DO NOTHING`, jadi tidak akan duplikat data.

---

### 8. Jalankan Backend Services

Jalankan semua backend microservices dalam mode development (dengan hot reload):

```bash
make dev
```

Perintah ini menjalankan 5 service sekaligus di background:
- Auth Service (port 4001)
- User Service (port 4002)
- Soal Service (port 4003)
- Jawaban Service (port 4004)
- API Gateway (port 4000)

Log disimpan ke folder `logs/` — bukan di terminal. Untuk memantau log:

```bash
# Semua log
make logs

# Log error saja
make logs-error

# Log auth service saja
make logs-auth

# Log gateway saja
make logs-gateway
```

Tunggu ~5 detik lalu cek apakah semua service berjalan normal:

```bash
make health
```

Output yang diharapkan:

```
🏥 Triton Health Check
────────────────────────────────────
  ✅  auth-service    (4001)
  ✅  user-service    (4002)
  ✅  soal-service    (4003)
  ✅  jawaban-service (4004)
  ✅  api-gateway     (4000)
────────────────────────────────────
  ✅  Redis (6379)
  ✅  PostgreSQL (5432)
────────────────────────────────────
```

---

### 9. Jalankan Frontend

Buka **terminal baru** (jangan tutup terminal sebelumnya), lalu:

```bash
make frontend
```

Atau bisa langsung:

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

> Kalau port 3000 sudah dipakai, Next.js otomatis pindah ke port 3001. Perhatikan output di terminal.

---

### 10. Verifikasi

Buka browser dan akses:

| URL | Keterangan |
|-----|------------|
| http://localhost:3000 | Aplikasi utama (halaman login) |
| http://localhost:4000/health | Health check API Gateway |
| http://localhost:4001/health | Health check Auth Service |

Login dengan salah satu akun default di bawah — jika berhasil masuk ke dashboard, setup sudah selesai ✅

---

## 🔐 Akun Default

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | `admin@triton.id` | `admin123` | `/admin/dashboard` |
| Guru | `guru1@triton.id` | `guru123` | `/guru/dashboard` |
| Guru | `guru2@triton.id` | `guru123` | `/guru/dashboard` |
| Siswa | `siswa1@triton.id` | `siswa123` | `/siswa/dashboard` |
| Siswa | `siswa2@triton.id` | `siswa123` | `/siswa/dashboard` |
| Siswa | `siswa3@triton.id` | `siswa123` | `/siswa/dashboard` |
| Siswa | `siswa4@triton.id` | `siswa123` | `/siswa/dashboard` |
| Siswa | `siswa5@triton.id` | `siswa123` | `/siswa/dashboard` |

---

## 📋 Referensi Perintah Make

Semua perintah dijalankan dari **root folder project** (`tritonapp/`).

| Perintah | Fungsi |
|----------|--------|
| `make install` | Install semua npm dependencies |
| `make dev` | Jalankan semua backend service (hot reload) |
| `make frontend` | Jalankan frontend Next.js |
| `make stop` | Hentikan semua backend service |
| `make restart` | Stop lalu start ulang semua service |
| `make health` | Cek status semua service |
| `make logs` | Pantau semua log (Ctrl+C untuk berhenti) |
| `make logs-error` | Pantau log error saja |
| `make logs-auth` | Pantau log auth-service saja |
| `make logs-gateway` | Pantau log api-gateway saja |
| `make logs-clean` | Hapus semua file log |
| `make db-init` | Jalankan ulang schema migration |
| `make seed` | Seed data pengguna default |
| `make build` | Compile TypeScript semua service |
| `make start` | Build + jalankan mode production |
| `make clean` | Hapus semua folder `dist/` |
| `make help` | Tampilkan semua perintah yang tersedia |

---

## 🔧 Troubleshooting

### ❌ `docker: command not found`
Docker belum terinstall. Install dari [docker.com](https://www.docker.com/get-started), lalu pastikan Docker Desktop sudah berjalan.

---

### ❌ `Error: connect ECONNREFUSED 127.0.0.1:5432`
PostgreSQL belum berjalan. Jalankan:
```bash
docker compose up -d postgres redis
```
Lalu cek: `docker ps` — pastikan `triton-postgres` ada di list.

---

### ❌ `database "db_auth" does not exist`
Kamu belum membuat database. Ulangi [Langkah 4](#4-buat-4-database).

---

### ❌ `relation "users" does not exist`
Schema belum dijalankan. Ulangi [Langkah 5](#5-jalankan-schema-migration).

---

### ❌ `make: command not found`
- **macOS:** Jalankan `xcode-select --install`
- **Linux (Ubuntu/Debian):** `sudo apt install make`
- **Windows:** Gunakan WSL 2, atau install [Make for Windows](http://gnuwin32.sourceforge.net/packages/make.htm)

---

### ❌ Service tidak muncul di `make health`
Tunggu ~10 detik setelah `make dev` lalu coba lagi. Kalau masih gagal, cek error log:
```bash
make logs-error
```

---

### ❌ Port sudah dipakai (`address already in use`)
Cari proses yang memakai port tersebut (contoh port 4001):
```bash
lsof -i :4001
```
Lalu kill prosesnya:
```bash
kill -9 <PID>
```
Atau hentikan semua service Triton dulu:
```bash
make stop
```

---

### ❌ `Cannot find module` atau error TypeScript saat `make dev`
Dependencies belum terinstall sempurna. Coba:
```bash
make stop
make install
make dev
```

---

### ❌ Frontend tidak bisa konek ke API (`Network Error`)
Pastikan:
1. Backend sudah berjalan — cek `make health`
2. File `.env` ada di root project dan isinya benar
3. `NEXT_PUBLIC_API_URL=http://localhost:4000` ada di `.env`

---

### ❌ Login gagal padahal akun benar
Kemungkinan seed belum dijalankan. Cek apakah tabel users terisi:
```bash
docker exec -it triton-postgres psql -U triton_user -d db_auth -c "SELECT email, role FROM users;"
```
Kalau kosong, jalankan: `make seed`

---

## 🛑 Cara Stop Semua Service

Untuk menghentikan semua backend service:

```bash
make stop
```

Untuk menghentikan PostgreSQL dan Redis (Docker):

```bash
docker compose down
```

Untuk menghentikan frontend: tekan `Ctrl + C` di terminal yang menjalankan `make frontend`.

---

## 📊 Ringkasan Urutan Setup (Quick Reference)

```bash
# 1. Clone
git clone https://github.com/DodikSukma/triton-tryout-app.git
cd triton-tryout-app

# 2. Docker - jalankan database
docker compose up -d postgres redis

# 3. Buat 4 database
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_auth;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_user;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_soal;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_jawaban;"

# 4. Schema migration
docker exec -i triton-postgres psql -U triton_user -d db_auth    < services/auth-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_user    < services/user-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_soal    < services/soal-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_jawaban < services/jawaban-service/src/db/schema.sql

# 5. Install & seed
make install
make seed

# 6. Jalankan backend (terminal 1)
make dev

# 7. Jalankan frontend (terminal 2 — baru)
make frontend

# 8. Buka browser
# http://localhost:3000
```

---

## 👨‍💻 Developer

Developed by **Dodik Sukma Indranata**  
Software Engineer · Medical Records & Hospital Information System Developer

---

## 📄 License

Private Project — Triton Denpasar
