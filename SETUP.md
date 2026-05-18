# Triton Denpasar — Setup Guide

## Logo

Tambahkan file logo Anda ke:

```
frontend/public/logo.png
```

Logo ini digunakan di Navbar, Sidebar, halaman login, landing page, dan footer.
Ukuran yang disarankan: minimal 200×68 px, format PNG dengan background transparan.

## Memulai

### 1. Jalankan infrastruktur dengan Docker Compose

```bash
docker compose up -d postgres redis
```

### 2. Buat database untuk setiap service

```bash
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_auth;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_user;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_soal;"
docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_jawaban;"
```

### 3. Jalankan schema migration

```bash
docker exec -i triton-postgres psql -U triton_user -d db_auth < services/auth-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_user < services/user-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_soal < services/soal-service/src/db/schema.sql
docker exec -i triton-postgres psql -U triton_user -d db_jawaban < services/jawaban-service/src/db/schema.sql
```

### 4. Seed data awal

```bash
cd scripts && npm install && npm run seed
```

Akun default setelah seeding:
| Email | Password | Role |
|---|---|---|
| admin@triton.id | admin123 | admin |
| guru1@triton.id | guru123 | guru |
| siswa1@triton.id | siswa123 | siswa |

### 5. Jalankan semua service

```bash
docker compose up -d
```

### 6. Jalankan frontend

```bash
cd frontend && npm install && npm run dev
```

Frontend tersedia di: http://localhost:3000
API Gateway tersedia di: http://localhost:4000
