# 🎓 Triton Denpasar — Platform Tryout Online (CBT)

Platform tryout ujian online (Computer Based Test) terintegrasi yang dirancang khusus untuk **Triton Denpasar**.  
Dibangun dengan arsitektur **Microservices** — Next.js 14 di frontend client, Node/Express.js di backend API, PostgreSQL untuk penyimpanan data terisolasi, dan Redis untuk session caching.

---

## 📋 Daftar Isi

1. [Prerequisites / Prasyarat](#-prerequisites)
2. [Struktur Proyek](#-struktur-proyek)
3. [Pemetaan Port (Port Map)](#-pemetaan-port)
4. [Panduan Setup dari Nol](#-setup-dari-nol)
   - [1. Clone Repository](#1-clone-repository)
   - [2. Setup File .env](#2-setup-file-env)
   - [3. Jalankan Docker Compose](#3-jalankan-docker-postgresql--redis)
   - [4. Membuat 5 Database](#4-membuat-5-database)
   - [5. Menginisialisasi Skema Tabel (Migration)](#5-menginisialisasi-skema-tabel-migration)
   - [6. Install Dependencies](#6-install-dependencies)
   - [7. Seed Data Awal](#7-seed-data-awal)
   - [8. Jalankan Backend Services](#8-jalankan-backend-services)
   - [9. Jalankan Frontend Client](#9-jalankan-frontend-client)
   - [10. Verifikasi Kesehatan Layanan](#10-verifikasi-kesehatan-layanan)
5. [Daftar Akun Default](#-akun-default)
6. [Referensi Perintah Make](#-referensi-perintah-make)
7. [Troubleshooting & Pemecahan Masalah](#-troubleshooting)
8. [Menghentikan Layanan (Stop Services)](#-cara-stop-semua-service)

---

## ✅ Prerequisites

Pastikan perkakas berikut telah terinstal sebelum Anda memulai setup:

| Tool | Versi Minimum | Cek Versi | Unduh / Instalasi |
|------|--------------|-----------|---------|
| **Node.js** | 18.x | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x | `npm -v` | Terinstal otomatis bersama Node.js |
| **Docker** | 20.x | `docker -v` | [docker.com](https://www.docker.com/get-started) |
| **Docker Compose** | 2.x | `docker compose version` | Bundled dalam Docker Desktop |
| **Make** | any | `make -v` | macOS: CLI Tools / Linux: `sudo apt install make` |

> **Windows?** Kami sangat merekomendasikan penggunaan **WSL 2** (Windows Subsystem for Linux) untuk kompatibilitas script bash dan perintah `Makefile` yang optimal.

---

## 📂 Struktur Proyek

```
tritonapp/
├── frontend/                   # Client Next.js 14 App Router (port 3000)
│   ├── src/app/                # Halaman, routing, dan global layouts
│   ├── src/components/         # Reusable UI components (shadcn/tailwind)
│   └── public/                 # Aset statis & logo.png (logo triton)
│
├── services/
│   ├── api-gateway/            # Reverse proxy port 4000 & middleware session
│   ├── auth-service/           # Manajemen login & express-session (port 4001)
│   ├── user-service/           # Manajemen profil pengguna & audit log (port 4002)
│   ├── sd-service/             # Bank Soal, CBT runner, scoring SD (port 4005)
│   ├── smp-service/            # Bank Soal, CBT runner, scoring SMP (port 4006)
│   └── sma-service/            # Bank Soal, CBT runner, scoring SMA (port 4007)
│
├── scripts/
│   ├── seed.ts                 # Script pengisi master data & default users
│   ├── dev.sh                  # Start dev script dengan ts-node-dev
│   ├── start.sh                # Start production build script
│   └── stop.sh                 # Stop script untuk membersihkan background process
│
├── logs/                       # File logs keluaran stdout per service (auto-generated)
├── .env                        # Variabel environment (WAJIB ada)
├── docker-compose.yml          # Container PostgreSQL & Redis local development
├── Makefile                    # Automasi command-line pipeline pengembang
└── README.md
```

---

## 🔌 Pemetaan Port

| Service | Port | Database | Keterangan |
|---------|------|----------|------------|
| Frontend Client | **3000** | — | Server pengembang Next.js |
| API Gateway | **4000** | — | Titik masuk utama HTTP request browser |
| Auth Service | **4001** | `db_auth` | Autentikasi user & cache session Redis |
| User Service | **4002** | `db_user` | Profil & logs pengguna |
| SD Service | **4005** | `db_sd` | Manajemen tryout & CBT peserta jenjang SD |
| SMP Service | **4006** | `db_smp` | Manajemen tryout & CBT peserta jenjang SMP |
| SMA Service | **4007** | `db_sma` | Manajemen tryout & CBT peserta jenjang SMA |
| PostgreSQL | **5432** | — | Relational Database Engine lokal |
| Redis | **6379** | — | Session Caching Store |

---

## 🚀 Setup dari Nol

### 1. Clone Repository
```bash
git clone https://github.com/DodikSukma/triton-tryout-app.git
cd triton-tryout-app
```

### 2. Setup File `.env`
Salin template konfigurasi lokal ke root project:
```bash
cp .env.example .env
```
*(Bila file `.env` sudah ada, pastikan isinya mendefinisikan port 4000-4007 dengan benar).*

### 3. Jalankan Docker (PostgreSQL + Redis)
Jalankan container database dan cache lokal:
```bash
docker compose up -d postgres redis
```

### 4. Membuat 5 Database
Buat kelima skema database PostgreSQL terpisah untuk masing-masing microservices:
```bash
make db-create
```
*(Perintah ini bersifat idempotent, aman dijalankan berkali-kali tanpa menimpa database yang sudah ada).*

### 5. Menginisialisasi Skema Tabel (Migration)
Terapkan file SQL skema tabel untuk semua layanan:
```bash
make db-init
```

### 6. Install Dependencies
Unduh dan pasang dependencies npm untuk semua modul proyek secara sekaligus:
```bash
make install
```

### 7. Seed Data Awal
Isi database dengan kelas, mapel master, dan beberapa akun dummy siap pakai:
```bash
make seed
```

### 8. Jalankan Backend Services
Jalankan seluruh Express.js microservices (termasuk API Gateway) di latar belakang:
```bash
make dev
```
Log keluaran services dapat dipantau di direktori `logs/` menggunakan perintah `make logs` atau `make logs-error`.

### 9. Jalankan Frontend Client
Jalankan server Next.js lokal:
```bash
make frontend
```
Aplikasi frontend akan tersedia di alamat browser: **http://localhost:3000**

### 10. Verifikasi Kesehatan Layanan
Jalankan status checking untuk memastikan seluruh koneksi database dan microservices berjalan baik:
```bash
make health
```
Anda harus melihat status checklist hijau `✅` di seluruh daftar layanan.

---

## 🔐 Akun Default

Gunakan daftar akun berikut untuk masuk ke dashboard role masing-masing:

| Peran (Role) | Alamat Email | Kata Sandi (Password) | Dialihkan Ke |
|------|-------|----------|-----------|
| **Admin** | `admin@triton.id` | `admin123` | `/admin/dashboard` |
| **Guru** | `guru1@triton.id` | `guru123` | `/guru/dashboard` |
| **Siswa** | `siswa1@triton.id` | `siswa123` | `/siswa/dashboard` |

---

## 📋 Referensi Perintah Make

Semua perintah dijalankan di root direktori proyek `tritonapp/`:

| Perintah | Fungsi / Kegunaan |
|----------|-------------------|
| `make install` | Menginstal dependencies npm untuk semua modul &amp; frontend |
| `make dev` | Menjalankan seluruh backend microservices dalam mode hot-reload |
| `make frontend` | Menjalankan server pengembang Next.js |
| `make stop` | Menghentikan paksa semua proses backend microservices |
| `make restart` | Menghentikan lalu menjalankan kembali semua backend |
| `make health` | Memeriksa status kesehatan koneksi semua layanan |
| `make logs` | Memantau seluruh file log secara real-time |
| `make logs-error` | Memantau log error saja |
| `make logs-clean` | Menghapus semua file log di direktori logs/ |
| `make db-create` | Membuat database PostgreSQL yang dibutuhkan di Docker |
| `make db-init` | Menerapkan skema migrasi SQL ke seluruh database |
| `make seed` | Melakukan seeding akun default dan master data |
| `make build` | Men-compile TypeScript semua service backend |
| `make start` | Build &amp; jalankan platform dalam mode production |
| `make clean` | Menghapus folder dist/ sisa build kompilasi TypeScript |

---

## 🔧 Troubleshooting

### ❌ `database "db_sd" does not exist`
Anda belum menjalankan perintah pembuatan database di Docker. Jalankan: `make db-create`.

### ❌ `Error: connect ECONNREFUSED 127.0.0.1:5432`
Layanan database PostgreSQL di Docker belum menyala. Jalankan: `docker compose up -d postgres redis`.

### ❌ Port EADDRINUSE (`address already in use`)
Ada port service (misal 4000) yang terkunci oleh sisa proses sebelumnya. Temukan PID-nya dan bunuh paksa:
```bash
lsof -i :4000
kill -9 <PID>
```
Atau jalankan `make stop` untuk membersihkan seluruh sisa background node process proyek ini.

---

## 🛑 Cara Stop Semua Service

1. Hentikan frontend: Tekan `Ctrl + C` pada terminal Next.js.
2. Hentikan backend microservices: Jalankan `make stop`.
3. Hentikan container Docker: Jalankan `docker compose down`.

---

Developed for **Triton Denpasar** Bimbel CBT Platform. All rights reserved.
