# Task TRN-20: Exam Violations & Per-Question Timers

## Overview
This task enhances the exam execution experience for students by introducing stricter violation alerts and granular time management:
1. **Violation UI/UX**: Move the exam violation notification (e.g., tab switching) from the bottom right to a large, centered modal, and add an audio alert.
2. **Per-Question Timers**: Allow questions to have individual time limits. `Admin-soal` can toggle this feature ON/OFF when creating a Super Try Out.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(siswa)/ujian/[id]/page.tsx` (Exam engine: Violation modal and sound logic, Timer logic)
- `frontend/src/app/(admin-soal)/admin-soal/super-tryout/create/page.tsx` (Toggle for per-question timer)
- `frontend/src/app/(guru)/guru/bank-soal/create/page.tsx` (Add time duration field per question)

### Backend Services
- `services/api/models/Question.go` (Add `time_limit_seconds` field)
- `services/api/models/TryOut.go` (Add `is_per_question_timer_enabled` boolean)

## ⚙️ Detailed Specifications

### 1. Violation Alert Redesign
- **Audio Notification**: Add an HTML5 `<audio>` element with a warning sound (e.g., `violation-alert.mp3`). Play this sound whenever a violation event (like `visibilitychange`) triggers.
- **Centered Modal**: Remove the small bottom-right toast notification. Replace it with a large, centered SweetAlert2 or custom React Modal overlaying the entire screen with a stark warning message ("PERINGATAN PELANGGARAN!").

### 2. Per-Question Timer Logic
- **Question Creation**: When Teachers create questions in Bank Soal, add an input field for "Waktu Pengerjaan (Detik/Menit)" for each individual question.
- **Super Try Out Creation**: Add a toggle switch `[ ] Aktifkan Waktu Per Soal` when Admin-Soal creates a Try Out.
- **Exam Engine**: 
  - If `is_per_question_timer_enabled` is true, display a countdown timer specific to the active question. 
  - Once the question timer hits 0, automatically lock the question or auto-navigate to the next question.
  - The overall Try Out timer still runs concurrently.

## ⚡ Verification Plan
1. **Violation Modal**: Start an exam as a Siswa. Switch browser tabs. Return to the exam tab and verify a large centered modal appears and a sound plays.
2. **Per-Question Timer**: As Admin-Soal, create a Try Out with "Waktu Per Soal" enabled. Start the exam as Siswa. Verify each question has its own countdown timer and forces navigation when expired.
