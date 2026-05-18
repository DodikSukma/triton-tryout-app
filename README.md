````md
# 🎓 Triton Denpasar — Platform Tryout Online

Platform Tryout Online terintegrasi untuk lembaga pendidikan **Triton Denpasar**.  
Aplikasi ini dibangun menggunakan arsitektur **Microservices** dengan **Next.js 14 (App Router)** di sisi frontend dan **Express.js** di sisi backend.

---

# 🚀 Teknologi Utama

## Frontend
- Next.js 14 (App Router)
- React
- Tailwind CSS
- shadcn/ui
- TypeScript

## Backend
- Node.js
- Express.js
- TypeScript
- Microservices Architecture

## Database & Infrastruktur
- PostgreSQL
- Redis
- Docker & Docker Compose

## Authentication
- Session-based Authentication
- express-session
- Redis Session Store
- **Tanpa JWT**

---

# 📂 Struktur Proyek

```bash
triton-tryout-app/
│
├── frontend/                 # Frontend Next.js
│
├── services/
│   ├── api-gateway/          # API Gateway (Port 4000)
│   ├── auth-service/         # Authentication Service (Port 4001)
│   ├── user-service/         # User Management Service (Port 4002)
│   ├── soal-service/         # Question Service (Port 4003)
│   └── jawaban-service/      # Answer Service (Port 4004)
│
├── scripts/                  # Utility scripts & automation
│
├── docker-compose.yml
├── Makefile
├── CLAUDE.md                 # Development Rules & Architecture Guide
└── README.md
````

---

# ⚠️ Penting untuk Developer

Sebelum melakukan perubahan kode, **WAJIB** membaca file:

```bash
CLAUDE.md
```

File tersebut berisi:

* Aturan arsitektur project
* Coding convention
* Standar UI/UX
* Aturan penggunaan logo
* Struktur folder
* Naming convention
* Panduan pengembangan microservices
* Standard API response
* Security guideline

---

# 🛠️ Prasyarat (Prerequisites)

Pastikan sistem Anda telah terinstal:

* Node.js v18+
* Docker
* Docker Compose
* PostgreSQL Client (Opsional)
* make

## Linux/macOS

Biasanya `make` sudah tersedia secara default.

## Windows

Disarankan menggunakan:

* WSL (Windows Subsystem for Linux)

---

# ⚙️ Instalasi & Setup Local Development

## 1. Clone Repository

```bash
git clone https://github.com/DodikSukma/triton-tryout-app.git
cd triton-tryout-app
```

---

## 2. Install Dependencies

Install seluruh dependency frontend dan backend:

```bash
make install
```

---

## 3. Tambahkan Logo Wajib

Pastikan file logo tersedia pada:

```bash
frontend/public/logo.png
```

> ⚠️ Jangan menggunakan placeholder logo.

Logo ini digunakan pada:

* Navbar
* Sidebar
* Login Page
* Dashboard
* PDF Export
* dan seluruh branding aplikasi.

---

## 4. Jalankan Infrastruktur Docker

Nyalakan PostgreSQL dan Redis:

```bash
docker compose up -d postgres redis
```

---

# 🗄️ Persiapan Database

## 1. Membuat Database

Masuk ke PostgreSQL container lalu buat database untuk setiap service:

```bash
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_auth;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_user;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_soal;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_jawaban;"
```

---

## 2. Inisialisasi Schema Database

Jalankan schema SQL untuk seluruh service:

```bash
make db-init
```

---

# 🚀 Menjalankan Backend Services

Menjalankan seluruh backend microservices dalam mode development:

```bash
make dev
```

Mode ini menggunakan:

* ts-node-dev
* hot reload
* automatic restart

---

## Monitoring Logs

Untuk memantau log seluruh services:

```bash
make logs
```

---

# 🌐 Menjalankan Frontend

Buka terminal baru lalu jalankan:

```bash
make frontend
```

Frontend akan berjalan pada:

```bash
http://localhost:3000
```

---

# 🌱 Seeding Data Awal

Menambahkan data dummy awal:

```bash
make seed
```

Data yang dibuat:

* 1 Admin
* 2 Guru
* 5 Siswa

---

# 🔐 Akun Default

| Role  | Email                                       | Password |
| ----- | ------------------------------------------- | -------- |
| Admin | [admin@triton.id](mailto:admin@triton.id)   | admin123 |
| Guru  | [guru1@triton.id](mailto:guru1@triton.id)   | guru123  |
| Siswa | [siswa1@triton.id](mailto:siswa1@triton.id) | siswa123 |

---

# 🌐 Endpoint Aplikasi

## Frontend

```bash
http://localhost:3000
```

## API Gateway

```bash
http://localhost:4000
```

---

# 📋 Daftar Perintah Make

Jalankan seluruh perintah dari root project.

| Command         | Deskripsi                           |
| --------------- | ----------------------------------- |
| `make install`  | Install seluruh dependencies        |
| `make dev`      | Menjalankan semua backend services  |
| `make frontend` | Menjalankan frontend Next.js        |
| `make build`    | Compile TypeScript seluruh services |
| `make start`    | Menjalankan production build        |
| `make stop`     | Menghentikan backend services       |
| `make logs`     | Monitoring logs seluruh services    |
| `make health`   | Health check seluruh API            |
| `make db-init`  | Inisialisasi database schema        |
| `make seed`     | Menjalankan database seeding        |
| `make help`     | Menampilkan bantuan command         |

---

# 🧩 Arsitektur Microservices

Setiap service memiliki:

* Database PostgreSQL sendiri
* Environment sendiri
* Schema sendiri
* Independent deployment

## Services Overview

| Service         | Port | Tanggung Jawab                  |
| --------------- | ---- | ------------------------------- |
| API Gateway     | 4000 | Reverse proxy & request routing |
| Auth Service    | 4001 | Login, session, authentication  |
| User Service    | 4002 | Manajemen user                  |
| Soal Service    | 4003 | Manajemen soal tryout           |
| Jawaban Service | 4004 | Penyimpanan jawaban & scoring   |

---

# 🔒 Sistem Authentication

Project menggunakan:

* express-session
* Redis session store
* HTTP-only cookies

## Kenapa Tidak Menggunakan JWT?

Karena:

* Session lebih aman untuk aplikasi internal
* Mudah melakukan session invalidation
* Mengurangi risiko token leakage
* Lebih cocok untuk sistem akademik terintegrasi

---

# 🎨 Standar UI/UX

Aplikasi menggunakan:

* Tailwind CSS
* shadcn/ui
* Responsive Layout
* Modern Dashboard Design
* Clean Academic Theme

Panduan lengkap terdapat di:

```bash
CLAUDE.md
```

---

# 📦 Production Build

## Build Semua Services

```bash
make build
```

## Jalankan Production

```bash
make start
```

---

# 🧪 Health Check API

```bash
make health
```

---

# 📝 Catatan Pengembangan

## Wajib Menggunakan:

* TypeScript strict mode
* Service isolation
* Environment variables
* Shared response format
* Centralized error handling

## Dilarang:

* Hardcode credential
* Direct database access antar service
* Menggunakan JWT
* Mengubah logo default Triton

---

# 👨‍💻 Developer

Developed by:

**Dodik Sukma Indranata**

Software Engineer
Medical Records & Hospital Information System Developer

---

# 📄 License

Private Project — Triton Denpasar

```
```
