# Triton Denpasar — Panduan Setup Pengembang (Lokal)

Panduan ini menjelaskan langkah demi langkah untuk mengonfigurasi dan menjalankan platform Triton Denpasar di lingkungan pengembangan lokal Anda.

---

## 🎨 Menambahkan Logo Platform

Sebelum menjalankan aplikasi, pastikan berkas logo resmi Anda ditempatkan pada path berikut:

```
frontend/public/logo.png
```

Logo ini digunakan secara konsisten pada Header, Sidebar, halaman login, landing page, dan footer.
*   **Ukuran yang disarankan**: minimal `200×68 px`.
*   **Format**: `PNG` dengan latar belakang transparan.

---

## ⚙️ Langkah Instalasi & Setup

Ikuti langkah-langkah di bawah ini secara berurutan:

### 1. Jalankan Infrastruktur Dasar (Docker Compose)
Pastikan Docker Desktop sudah menyala di komputer Anda, lalu jalankan PostgreSQL dan Redis di latar belakang:

```bash
docker compose up -d postgres redis
```

Verifikasi container berjalan dengan menjalankan perintah `docker ps`. Anda harus melihat dua container: `triton-postgres` dan `triton-redis`.

### 2. Konfigurasi File Environment Variables (`.env`)
Salin file template `.env` pada folder root project (atau pastikan berkas `.env` sudah terisi dengan benar):

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=triton_user
POSTGRES_PASSWORD=triton_secret_2024
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=triton_session_super_secret_2024_change_this
SESSION_MAX_AGE_MS=28800000

AUTH_SERVICE_URL=http://localhost:4001
USER_SERVICE_URL=http://localhost:4002
SD_SERVICE_URL=http://localhost:4005
SMP_SERVICE_URL=http://localhost:4006
SMA_SERVICE_URL=http://localhost:4007
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

### 3. Buat Database & Skema Tabel
Gunakan perintah `make` otomatis untuk membuat kelima database dan menginisialisasi skema SQL:

```bash
# 1. Membuat database db_auth, db_user, db_sd, db_smp, db_sma di dalam Postgres docker
make db-create

# 2. Menginisialisasi semua tabel dan skema SQL pada kelima database tersebut
make db-init
```

### 4. Install Dependencies
Instal seluruh paket dependensi npm untuk semua microservices, frontend Next.js, dan skrip helper secara bersamaan:

```bash
make install
```

### 5. Seed Data Pengguna & Ujian Default
Isi database dengan data master (kelas, mata pelajaran) dan data dummy uji coba awal (Admin, Guru, Siswa, serta tryout sampel):

```bash
make seed
```

**Kredensial Akun Default Hasil Seeding:**
| Role | Email | Password | Rute Dashboard |
|---|---|---|---|
| **Admin** | `admin@triton.id` | `admin123` | `/admin/dashboard` |
| **Guru** | `guru1@triton.id` | `guru123` | `/guru/dashboard` |
| **Siswa** | `siswa1@triton.id` | `siswa123` | `/siswa/dashboard` |

### 6. Jalankan Platform di Mode Development
Jalankan semua backend microservices (termasuk API Gateway) dengan fitur *live hot-reload*:

```bash
make dev
```

Pada terminal baru (jangan tutup terminal microservices), jalankan server pengembang frontend Next.js:

```bash
make frontend
```

*   **Frontend Client** berjalan di: http://localhost:3000
*   **API Gateway** berjalan di: http://localhost:4000
*   **Dokumentasi Portal Pengembang** tersedia di: http://localhost:3000/docs/index.html (atau akses berkas lokal `docs/index.html` pada browser Anda).
