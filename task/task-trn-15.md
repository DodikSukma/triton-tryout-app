# Task TRN-15: Triton CBT Demo Sequence & Verification

## Overview
This task outlines the complete validation and execution steps for conducting the Triton Denpasar Tryout CBT live demo. It ensures that the database starts from a blank slate (clean tryouts and exam histories) and that all user guide flows can be walked through for the four roles: Admin, Admin Soal, Guru, and Siswa.

---

## 📂 Verification Targets

### 1. Database Blank Slate Verification
- Verify that active tryouts, student responses, and results tables in `db_sd`, `db_smp`, and `db_sma` are completely empty.
- Ensure that master data (reference lists) and user accounts remain populated and active.

### 2. User Guide Documentation Verification
- Access the local user guide at `docs/docs-guide-user/index.html` or through the server route.
- Verify the inclusion of the new **Admin Soal** role filters, sidebar links, and detailed step-by-step documentation for all roles.

### 3. End-to-End Role Play Flows
- Execute the specific demo sequences for each of the four roles using their default credentials.

---

## ⚙️ Detailed Demo & Verification Steps

### 1. Database Check
Before starting the demo, double-check that the cleanup command was executed successfully:
```bash
# Optional: To force clear tryouts again if any tests were run:
make db-clear
```
- Connect to `db_sd`, `db_smp`, or `db_sma` using a database tool and check:
  - `SELECT COUNT(*) FROM tryouts;` (Must return `0`)
  - `SELECT COUNT(*) FROM sesi_tryout;` (Must return `0`)
  - Ensure that tables `users` in `db_auth` and `profiles` in `db_user` are **still populated** (e.g. `admin@triton.id`, `guru1@triton.id`, `siswa1@triton.id` exist).

---

### 2. Role-by-Role Demo Walkthrough

#### Flow A: Guru (Teacher) — Uji Coba Pembuatan Ujian
1. **Login**: Log in to `/login` using:
   - **Email**: `guru.sma@triton.id` (or `guru1@triton.id`)
   - **Password**: `guru123`
2. **Dashboard**: Observe the Teacher Dashboard showing 0 active tryouts (because of the db-clear).
3. **Create Tryout**:
   - Click **Buat Tryout Baru**.
   - Input fields:
     - **Judul**: `Simulasi Fisika SMA Mandiri`
     - **Mata Pelajaran**: `Fisika`
     - **Kelas**: `12 SMA`
     - **Durasi**: `60` menit
   - Save the tryout. It is now in `Draft` state.
4. **Manage Questions (Manual LaTeX)**:
   - Click **Kelola Soal** on the card.
   - Click **Tambah Soal Manual**.
   - Select type: **Pilihan Ganda**, Input Kode Soal: `FIS-12-001`, Bobot: `5`.
   - Write the question body using LaTeX format:
     `Berapakah energi kinetik dari benda bermassa $m$ dengan kecepatan $v$?`
   - Set the options:
     - A: `$E_k = \frac{1}{2}mv^2$` (Mark as Correct Option `*`)
     - B: `$E_k = mv$`
     - C: `$E_k = mgh$`
     - D: `$E_k = \frac{1}{2}kx^2$`
   - Write explanation:
     `Energi kinetik dinyatakan dengan rumus $E_k = \frac{1}{2}mv^2$.`
   - Save the question.
5. **Submit for Approval**:
   - Return to the tryout page and click **Ajukan Persetujuan**.
   - Status changes to `Menunggu Persetujuan` (Pending Approval).

#### Flow B: Admin Soal — Persetujuan & Super Try Out
1. **Login**: Log in using:
   - **Email**: `adminsoal1@triton.id`
   - **Password**: `adminsoal123`
2. **Dashboard**: Navigate to `/admin-soal/dashboard`.
3. **Approval**:
   - Look under **Tryout Guru Menunggu Persetujuan**.
   - You should see the `Simulasi Fisika SMA Mandiri` submitted by the guru.
   - Click **Setujui & Publikasi**. The tryout is immediately published (`published` status).
4. **Super Try Out**:
   - Click **Buat Super Try Out**.
   - Fill in: SMA, Title: `Super Try Out Nasional Fisika 2026`, Subject: `Fisika`, Class: `12 SMA`, Duration: `90` minutes.
   - Click **Buat & Kelola Soal** to access the questions workspace. Input questions directly.

#### Flow C: Siswa (Student) — CBT Exam Cockpit & Results
1. **Login**: Log in using:
   - **Email**: `siswa.sma@triton.id` (matches the SMA level of the tryout)
   - **Password**: `siswa123`
2. **Dashboard**: Observe the published tryout `Simulasi Fisika SMA Mandiri` with the button **Mulai Tryout**.
3. **Start Exam**:
   - Click **Mulai Tryout**.
   - Enter full-screen mode. Verify that the countdown timer is running.
4. **Proctoring Check (Cheating Simulation)**:
   - Try to press `Esc` to exit full-screen, or click outside the browser tab.
   - The screen should instantly lock red, prompting you to "Kembali ke Layar Penuh" to resume.
5. **Answer Questions**:
   - Select option **A** (which we marked as correct).
   - Click **Berikutnya**, then on the final question click **Selesai & Kumpulkan**.
   - Confirm submission in the modal.
6. **Review Results**:
   - Look at your score (should be 100/100).
   - Review the detailed explanation containing the rendered LaTeX formula.

#### Flow D: Admin (Super Admin) — Global Controls & Auditing
1. **Login**: Log in using:
   - **Email**: `admin@triton.id`
   - **Password**: `admin123`
2. **Dashboard**: Navigate to `/admin/dashboard` to view statistics. Use the level filters (SD/SMP/SMA) to watch the metrics filter dynamically.
3. **User Management**: Navigate to `/admin/users` and ensure you can toggle user accounts or suspend a user.
4. **Audit Logs**: Navigate to `/admin/logs` and verify that the logs capture all actions, including the login events, tryout creation, approval, and the student's proctoring warnings.

---

## ⚡ Verification Checklist
- [ ] Tryout database tables are completely clean (no dummy records) at the start.
- [ ] `docs/docs-guide-user/index.html` loads correctly with the Admin Soal navigation option.
- [ ] Users can successfully authenticate with default credentials for all 4 roles.
- [ ] LaTeX equation formatting parses correctly on the student results page.
- [ ] Proctor warning modal displays if full-screen mode is exited.
- [ ] Admin logs display audit entries chronologically.
