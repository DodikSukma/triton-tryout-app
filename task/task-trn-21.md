# Task TRN-21: Try Out Visibility & Excel Merge Reporting

## Overview
This task finalizes the viewing permissions for Try Outs and implements a comprehensive Excel reporting feature for `admin-soal`:
1. **Try Out Visibility**: Ensure Try Outs (created by `admin-soal`) are visible to Students to take, and visible to Teachers for monitoring (filtered by their specific subject).
2. **Teacher Monitoring**: Teachers can see who answered their subject's questions and the detailed breakdown of the answers.
3. **Merge Excel Report**: `Admin-soal` can view all respondents and export a merged Excel report summarizing scores across multiple subjects.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(siswa)/siswa/tryout/page.tsx` (List of available Try Outs)
- `frontend/src/app/(guru)/guru/tryout-monitoring/page.tsx` (New/Updated page for Teacher monitoring)
- `frontend/src/app/(admin-soal)/admin-soal/report/page.tsx` (Admin-soal reporting and Excel export)

### Backend Services
- `services/api/controllers/TryOutController.go` (Visibility logic for Siswa and Guru)
- `services/api/controllers/ReportController.go` (Excel generation logic)

## ⚙️ Detailed Specifications

### 1. Siswa & Guru Visibility
- **Siswa Dashboard**: Fetch active Try Outs where `status == published`. Clarify UI that these are official Try Outs (created by Admin-Soal).
- **Guru Dashboard**: Teachers only see Try Outs that contain questions from their assigned `mata_pelajaran`.
- **Teacher Detail View**: Clicking a Try Out shows a table of Students who took it. Clicking a Student shows the specific answers the student gave *only* for the teacher's subject.

### 2. Admin-Soal Merge Excel Report
- **Respondent List**: Admin-soal can view a master list of all students who took a Super Try Out.
- **Excel Export**: Add a "Download Report (Merge)" button.
- **Excel Columns format**:
  - `Nama Siswa`
  - `Jenjang` (Grade Level)
  - `Try Out Matematika` (Score)
  - `Try Out Fisika` (Score)
  - `Try Out Bahasa` (Score)
  - etc.
- **Backend Logic**: Aggregate the results by `user_id` and pivot the scores by `mata_pelajaran` to generate the requested Excel structure using a library like `excelize` (Go) or `exceljs` (Node/Next.js API).

## ⚡ Verification Plan
1. **Siswa View**: Log in as Siswa, ensure published Try Outs from Admin-Soal are available.
2. **Guru View**: Log in as Guru (Math). Ensure they can see the Try Out, see respondents, and view Math answers.
3. **Excel Export**: Log in as Admin-Soal. Go to Try Out reports, click "Download Report". Open the Excel file and verify the pivot columns (Name, Jenjang, Subject Scores) format correctly.
