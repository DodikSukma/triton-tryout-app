# Task TRN-19: Guru & Bank Soal Workflow Enhancements

## Overview
This task shifts the paradigm of the Teacher (Guru) role from directly creating Try Outs to exclusively creating "Bank Soal" (Question Banks). It also adds subject-based access control and filtering:
1. **Bank Soal Focus**: Change the Teacher dashboard terminology and flow from "Membuat Try Out" to "Membuat Bank Soal".
2. **Year Filter**: Add a filter by year (Tahun) in the Bank Soal list.
3. **Subject-based Crosscheck**: Assign specific subjects (Mata Pelajaran) to Teachers. Teachers sharing the same subject can view each other's Bank Soal.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(guru)/guru/dashboard/page.tsx` (Dashboard CTA and text changes)
- `frontend/src/app/(guru)/guru/bank-soal/page.tsx` (Add Year filter, Crosscheck view)
- `frontend/src/components/forms/GuruProfileForm.tsx` (If subject assignment is done here)

### Backend Services
- `services/api/models/User.go` or equivalent (Add subject/mata_pelajaran field to Guru role)
- `services/api/controllers/BankSoalController.go` (Update logic to fetch crosscheck bank soal by subject and filter by year)

## ⚙️ Detailed Specifications

### 1. Bank Soal Terminology & Year Filter
- **Dashboard Changes**: Change all buttons and texts in the Guru Dashboard that say "Buat Try Out" to "Buat Bank Soal".
- **Year Filter**: On the Bank Soal listing page, add a `<select>` dropdown for "Tahun" (Year). When selected, pass the `year` parameter to the backend to filter the displayed questions.

### 2. Subject-Based Role & Crosscheck
- **Teacher Subjects**: Ensure the database and auth context support mapping a Teacher to one or more `mata_pelajaran` (e.g., Matematika, Fisika).
- **Crosscheck View**: Modify the backend query for fetching Bank Soal for a Guru. Instead of only returning `WHERE author_id = current_user_id`, change it to return Bank Soal where `mata_pelajaran == current_user_subject`.
- **UI Differentiation**: Clearly mark which Bank Soal is created by "Saya" (Me) vs "Guru Lain" (Other Teachers).

## ⚡ Verification Plan
1. **Terminology**: Log in as Guru. Verify the dashboard says "Buat Bank Soal".
2. **Filter**: Go to Bank Soal. Apply the "Tahun" filter and verify the list updates.
3. **Crosscheck**: Log in as Guru A (Math). Verify they can see Bank Soal created by Guru B (Math), but not Guru C (Physics).
