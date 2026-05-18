# APP FLOW & USER JOURNEY — Triton Denpasar
# Complete flow for all three roles. Read before building any page.

---

## ROLE OVERVIEW

```
ADMIN   → manages users (create/edit/delete guru & siswa accounts)
GURU    → creates and manages tryouts + questions
SISWA   → takes tryouts and views results
```

All roles share: login page, profile page, logout.

---

## FLOW 1 — ADMIN

### Entry: /login → /admin/dashboard

```
Landing Page
    ↓ click "Masuk"
Login Page (/login)
    ↓ enter email + password → POST /auth/login
    ↓ server session created, role='admin'
Admin Dashboard (/admin/dashboard)
    ├── Stats: Total Users | Active Tryouts | Active Sessions
    ├── Quick actions
    └── Recent activity log

Admin Dashboard
    ↓ sidebar: "Kelola Guru"
Manage Guru (/admin/users?role=guru)
    ├── List all guru with: name, email, subjects, status toggle
    ├── Search + filter
    ├── "Tambah Guru" → Dialog form
    │     Fields: nama, email, password, mata_pelajaran (multi-select)
    │     → POST /users
    ├── Edit guru → Dialog form
    │     → PUT /users/:id
    ├── Toggle active/inactive
    │     → PUT /users/:id {is_active}
    └── Delete guru → Confirmation → DELETE /users/:id

Admin Dashboard
    ↓ sidebar: "Kelola Siswa"
Manage Siswa (/admin/users?role=siswa)
    ├── List all siswa with: name, email, kelas, status toggle
    ├── SEPARATE TABLE from Guru (different page or tab — NOT MIXED)
    ├── "Tambah Siswa" → Dialog form
    │     Fields: nama, email, password, kelas (select)
    │     → POST /users
    ├── Edit siswa
    ├── Toggle active/inactive
    └── Delete siswa

Admin
    ↓ sidebar: "Profil Saya"
Admin Profile (/admin/profil)
    → Update nama, telepon, bio, avatar
    → Change password
```

---

## FLOW 2 — GURU

### Entry: /login → /guru/dashboard

```
Login Page
    ↓ role='guru'
Guru Dashboard (/guru/dashboard)
    ├── Welcome: "Selamat datang, {nama} 👋"
    ├── Stats: Tryout Dibuat | Soal Dibuat | Siswa Mengerjakan
    └── Grid of tryout cards (all tryouts created by this guru)
        Each card shows: nama, subject, status, jumlah soal, durasi
        Actions: Kelola Soal | Edit | Delete | Publish/Unpublish

Guru Dashboard
    ↓ click "Buat Tryout Baru"
Create Tryout Dialog:
    Fields: Nama Tryout, Mata Pelajaran (select), Durasi (menit)
    → POST /tryouts
    → redirect to /guru/tryout/{id}/soal (question builder)

Guru Dashboard
    ↓ click "Kelola Soal" on a tryout card
Question Builder (/guru/tryout/{id}/soal)
    ├── Left panel: question list + "Tambah Soal" button
    ├── Right panel: question editor
    │
    ├── "Tambah Soal" → choice modal:
    │     [Tambah Manual] or [Generate dengan AI]
    │
    ├── MANUAL ADD:
    │     Select type: Pilihan Ganda | Essay
    │     Write question (rich text)
    │     Add options A-E (if PG), mark correct answer
    │     Set bobot
    │     → POST /tryouts/{id}/soal
    │
    ├── AI GENERATE (DEMO — static JSON):
    │     Select subject: Matematika | Fisika | Biologi
    │     Select quantity: 1 soal | 5 soal
    │     Click "Generate Soal"
    │     → return static JSON preset per subject
    │     → display generated questions for review
    │     → user can edit each before saving
    │     → POST all to /tryouts/{id}/soal (batch)
    │
    ├── Edit existing question → click in list → opens in right panel
    │     → PUT /soal/{soalId}
    │
    ├── Delete question → trash icon → confirmation → DELETE /soal/{soalId}
    │
    └── Publish tryout → "Publish" button
          Only if: at least 1 question AND each PG has correct answer
          → PATCH /tryouts/{id}/publish

Guru Dashboard
    ↓ click "Edit" on tryout card (⋯ menu)
Edit Tryout Dialog:
    Change: nama, mata_pelajaran, durasi, status
    → PUT /tryouts/{id}

Guru Dashboard
    ↓ click "Hapus" on tryout card (⋯ menu)
Delete Tryout:
    Confirmation dialog → DELETE /tryouts/{id}
    (cascade deletes all soal + opsi for that tryout)

Guru
    ↓ sidebar: "Profil Saya"
Guru Profile (/guru/profil)
    → avatar, nama, telepon, mata pelajaran (tags), bio
    → change password
```

---

## FLOW 3 — SISWA

### Entry: /login → /siswa/dashboard

```
Login Page
    ↓ role='siswa'
Siswa Dashboard (/siswa/dashboard)
    ├── Welcome: "Selamat datang, {nama} 👋 — Ayo lanjutkan persiapan!"
    ├── Stats: Tryout Tersedia | Selesai | Sedang Berlangsung | Rata-rata Nilai
    └── "Tryout Direkomendasikan" section (recently added, not yet taken)

Siswa Dashboard
    ↓ sidebar: "Tryout Tersedia"
Tryout List (/siswa/tryout)
    ├── Filter: search by name, filter by subject, filter by status
    ├── Cards: all published tryouts
    │     Each: subject badge, nama, durasi, jumlah soal, status
    │     Button: "Mulai Tryout" / "Lanjutkan" / "Lihat Hasil"
    │
    ├── Not started → click "Mulai Tryout"
    │     → Confirmation page (/siswa/tryout/{id})
    │         Shows: tryout info, rules, agreement checkbox
    │         → "Mulai" → POST /sesi → redirect to exam
    │
    ├── In progress → click "Lanjutkan"
    │     → directly to exam (/siswa/tryout/{id}/kerjakan?sesi={sesiId})
    │         Restores existing answers from GET /sesi/{sesiId}
    │
    └── Finished → click "Lihat Hasil"
          → Results page (/siswa/hasil/{sesiId})

Exam Page (/siswa/tryout/{id}/kerjakan)
    ├── No sidebar, no navbar — FULL SCREEN exam mode
    ├── Fixed header: logo + tryout name + timer + progress + "Kumpulkan" button
    ├── Left panel: question navigation grid (answered/unanswered/flagged)
    ├── Main: current question (render HTML + KaTeX)
    ├── Answer: PG options (click to select) OR essay textarea
    ├── Bottom bar: prev / flag / next buttons
    │
    ├── Auto-save: every answer saved immediately via POST /sesi/{sesiId}/jawab
    ├── Timer: counts down from durasi_menit, auto-submit at 0
    └── Submit: confirmation dialog → POST /sesi/{sesiId}/selesai → results

Results Page (/siswa/hasil/{sesiId})
    ├── Score hero: nilai, grade (A/B/C/D), trophy/star icon
    ├── Stats: benar / salah / tidak dijawab
    └── Per-question breakdown (correct/wrong, correct answer shown)

Siswa
    ↓ sidebar: "Riwayat & Nilai"
History (/siswa/riwayat)
    └── Table of all completed tryouts with: nama, nilai, tanggal, mata pelajaran

Siswa
    ↓ sidebar: "Profil Saya"
Siswa Profile (/siswa/profil)
    → avatar, nama, telepon, kelas (select), bio
    → change password
```

---

## SHARED FLOWS

### Authentication
```
Any protected route → check session via GET /auth/me
  → 401: redirect to /login
  → 403: redirect to /forbidden or dashboard
  → 200: render page

Login success → redirect based on role:
  admin → /admin/dashboard
  guru  → /guru/dashboard
  siswa → /siswa/dashboard

Logout:
  POST /auth/logout → destroy session → redirect to /login
```

### Route Protection (middleware.ts)
```
/admin/*  → requireAuth + requireRole('admin')
/guru/*   → requireAuth + requireRole('guru')
/siswa/*  → requireAuth + requireRole('siswa')
/login    → if already logged in: redirect to role dashboard
/         → public (no auth required)
```

---

## PAGE INVENTORY

### Public Pages
```
/              → Landing page
/login         → Login (shared for all roles)
```

### Admin Pages
```
/admin/dashboard         → stats + overview
/admin/users?role=guru   → manage guru (SEPARATE from siswa)
/admin/users?role=siswa  → manage siswa (SEPARATE from guru)
/admin/profil            → admin profile
```

### Guru Pages
```
/guru/dashboard          → tryout list + stats
/guru/tryout             → (redirect to dashboard)
/guru/tryout/[id]/soal   → question builder
/guru/profil             → guru profile
```

### Siswa Pages
```
/siswa/dashboard         → stats + recommended tryouts
/siswa/tryout            → list of available tryouts
/siswa/tryout/[id]       → tryout confirmation page
/siswa/tryout/[id]/kerjakan → exam page (full screen)
/siswa/hasil/[sesiId]    → results page
/siswa/riwayat           → history of all tryouts
/siswa/profil            → siswa profile
```
