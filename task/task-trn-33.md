# 🤖 AI Task: Execute Task TRN-33 - Dynamic Master Data integration for User Creation and Admin Dashboard

## 🎯 Task Objective
Integrate the master data tables (`master_kelas` and `master_mata_pelajaran`) dynamically into the Admin User Management screen to replace the hardcoded UI dropdown arrays (`KELAS_OPTIONS` and `MAPEL_OPTIONS`). This resolves the issue where SD and SMP class options were missing, preventing tryouts from appearing on SD/SMP student dashboards. It also empowers administrators to add or modify classes and subjects dynamically from the "Master Data" panel without code changes. Lastly, expose both "Master Soal" and "Master User" options as Quick Access cards on the Admin Dashboard.

---

## 📂 Target Files & Impact Areas

### 1. Frontend Client
- `frontend/src/app/(admin)/admin/users/page.tsx` (Replace hardcoded options with dynamic master data calls and add cascading class filters based on chosen education level)
- `frontend/src/app/(admin)/admin/dashboard/page.tsx` (Add "Master Soal" and "Master User" Quick Access cards)

---

## ⚙️ Detailed Specifications

### 1. Dynamic Dropdowns in User Creation / Edition Form
- In `frontend/src/app/(admin)/admin/users/page.tsx`:
  - Fetch master classes (`/master/kelas`) and master subjects (`/master/mata-pelajaran`) inside the user management dialog or main page container.
  - Remove the hardcoded `KELAS_OPTIONS` and `MAPEL_OPTIONS` arrays.
  - **For Students (Siswa)**:
    - Add a cascading filter on the `Kelas` select list: when `Jenjang Pendidikan` (SD, SMP, or SMA) is selected, filter the `master_kelas` list to only show options matching that level (e.g. choosing 'SD' shows '4 SD', '5 SD', '6 SD').
    - Bind the select list value to the dynamic kelas names.
  - **For Teachers (Guru)**:
    - Display all subjects fetched from `/master/mata-pelajaran` as selectable badges or options.
    - Save the list of chosen subjects as a comma-separated string when sending the profile updates to the backend.

### 2. Admin Dashboard Cards Integration
- In `frontend/src/app/(admin)/admin/dashboard/page.tsx`:
  - Update the "Akses Cepat" (Quick Access) array to include two new cards:
    1. **Master Soal**:
       - **Description**: "Atur subjek, kelas, & sub-mapel tryout"
       - **Link**: `/admin/master`
       - **Icon**: `Database` or `BookOpen`
    2. **Master User**:
       - **Description**: "Atur jenjang kelas & mapel pengguna"
       - **Link**: `/admin/master`
       - **Icon**: `Layers` or `GraduationCap`

---

## ⚡ Verification & Acceptance Criteria
1. **Verification of User Creation Dropdowns**:
   - Log in as `admin@triton.id`.
   - Navigate to **Kelola Siswa** -> **Tambah Siswa**.
   - Select **Jenjang Pendidikan: SD**. Verify that the **Kelas** dropdown updates to display SD classes (`4 SD`, `5 SD`, `6 SD`) dynamically loaded from the database.
   - Select **Jenjang Pendidikan: SMP**. Verify that the **Kelas** dropdown displays SMP classes (`7 SMP`, `8 SMP`, `9 SMP`).
   - Create a student with class `6 SD` and level `SD`. Log in as the student and verify that SD tryouts are displayed correctly (the firewall is bypassed correctly due to matching levels).
2. **Verification of Guru Subject Integration**:
   - Navigate to **Kelola Guru** -> **Tambah Guru**.
   - Verify that the Mata Pelajaran checklist is dynamically built from the database `master_mata_pelajaran` records rather than hardcoded values.
3. **Verification of Admin Dashboard Cards**:
   - Navigate to the Admin Dashboard.
   - Verify that "Master Soal" and "Master User" Quick Access cards are rendered beautifully on the page and correctly link to `/admin/master`.
