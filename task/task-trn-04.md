# 🤖 AI Task: Execute Task TRN-04 - Approval Workflows, Configurable Randomization, and Direct Share Links

Your task is to execute **Task TRN-04: Alur Approval & Validasi Admin, Engine Pengacakan Soal & Pilihan Ganda, dan Manajemen Jenjang User**. You will implement tryout review/publishing workflows, build a CBT randomization engine controlled by tryout-level toggles, configure user level firewalls, and create direct-start exam share links.

---

## 🎯 Task Objectives

1.  **Tryout Approval & Publishing Workflow (Guru ➔ Admin)**:
    *   Enable teachers (`guru`) to submit tryouts for approval.
    *   Enable administrators (`admin`) to review, request revisions (releasing back to `draft` with comments), approve, or directly **publish** tryouts.
2.  **Configurable Randomization Engine**:
    *   Add configurations to each tryout to control randomization:
        *   `randomize_questions`: Toggle whether the order of questions is shuffled for students.
        *   `randomize_options`: Toggle whether option letter positions (A-E) are shuffled.
    *   Generate and store the customized randomized sequence in session state to maintain layout consistency.
3.  **User Level Scoping (Jenjang Pendidikan)**:
    *   Add an explicit level field (`education_level`: `SD` | `SMP` | `SMA`) to user profiles.
    *   Enforce Gateway validation ensuring students can only access exams of their assigned level.
4.  **Shareable Direct-Start Exam Link**:
    *   Generate a share link for published tryouts.
    *   If a student visits the link:
        *   *Unauthenticated*: Redirect to login page (`/login?redirect=/siswa/tryout/:id/start-direct`). Upon login, redirect back.
        *   *Authenticated*: Automatically trigger `POST /sesi` to initialize or resume the session, then redirect directly to the distraction-free exam page.

---

## 🗄️ Database Schemas Update

### 1. Centralized Profiles Database (`db_user`)
```sql
ALTER TABLE profiles ADD COLUMN education_level VARCHAR(10) CHECK (education_level IN ('SD', 'SMP', 'SMA'));
```

### 2. Level-Specific Databases (`db_sd`, `db_smp`, `db_sma`)
Update the `tryouts` and `sesi_tryout` tables across all level databases:

```sql
-- Update Tryout review & randomization toggles
ALTER TABLE tryouts DROP CONSTRAINT IF EXISTS tryouts_status_check;
ALTER TABLE tryouts ADD CONSTRAINT tryouts_status_check CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'closed'));
ALTER TABLE tryouts ADD COLUMN revision_notes TEXT;
ALTER TABLE tryouts ADD COLUMN randomize_questions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tryouts ADD COLUMN randomize_options BOOLEAN NOT NULL DEFAULT true;

-- Update Session randomization mappings
ALTER TABLE sesi_tryout ADD COLUMN question_order UUID[];  -- Question ID sequence
ALTER TABLE sesi_tryout ADD COLUMN option_order JSONB;     -- Map: { "question_id": ["C", "A", "D", "B"] }
```

---

## 🏗️ Technical Implementation Details

### 1. Tryout Review & Direct Admin Publishing
*   **Guru Action**: Submit tryout via `PATCH /tryouts/:id/status` ➔ `{ status: 'pending_approval' }`.
*   **Admin Action**:
    *   `Approve`: Set status to `approved` (ready) or `published` (instantly active).
    *   `Reject / Revise`: Set status to `rejected` (returns to draft) with notes.
    *   `Publish / Unpublish`: Admins can toggle the state of any approved tryout directly.

### 2. Configurable Randomization Engine (Jawaban Service)
When generating an exam session (`POST /sesi`):
1.  Read the tryout configuration parameters (`randomize_questions` and `randomize_options`):
    *   **Question Shuffling**: If `randomize_questions` is `true`, apply a Fisher-Yates shuffle to the question ID array. If `false`, order by `nomor_soal` / creation order. Write the sequence to `question_order`.
    *   **Option Shuffling**: If `randomize_options` is `true`, shuffle the choice sequence (A-E) for each question. If `false`, preserve original option letters (A, B, C, D, E). Write the map to `option_order`.
2.  When serving `GET /sesi/:sesiId`, sort elements to align with `question_order` and `option_order`.

### 3. Direct Share Link Redirection Flow
Implement a client-side route `/siswa/tryout/[id]/start-direct` (or similar endpoint) on the frontend:
1.  **Auth Guard Middleware**: Check if the student is logged in.
    *   If not, redirect to `/login?redirect=/siswa/tryout/${id}/start-direct`. Store the redirect target path in session or router state.
    *   After logging in, Next.js checks for `redirect` query parameter and navigates back to `/siswa/tryout/${id}/start-direct`.
2.  **Direct Start Handling**:
    *   Invoke `POST /sesi` with `{ tryout_id: id }` in the background.
    *   On success, redirect the user immediately to the distraction-free exam screen `/siswa/tryout/${id}/kerjakan?sesi=${sesiId}` (or `/exam/${sesiId}`).
    *   If the session is already finished, show a warning or redirect to the results page `/siswa/hasil/${sesiId}`.

### 4. API Gateway Level Firewall
Enforce role and level constraints. Bypassed for admins, but blocked for students attempting to fetch or write to endpoints on microservices outside their `education_level`.

---

## 💻 Frontend Implementation Specifications

### 1. Admin Control Panel (`/admin/*`)
*   **User Management**: Add an `"Education Level"` (SD, SMP, SMA) dropdown selector in the Add/Edit User Dialog form.
*   **Approval & Publishing Tab**: A dashboard panel listing pending tryouts. Includes details and review action buttons. Admin can edit any tryout, toggle the `randomize_questions` / `randomize_options` settings, and directly publish/unpublish them.
*   **Copy Share Link**: Display a "Salin Link Sesi" button next to published tryouts, copy-pasting the `/siswa/tryout/:id/start-direct` URL to the clipboard.

### 2. Guru Tryout Creation & Review Alerts (`/guru/dashboard`)
*   Add toggles for "Acak Urutan Soal" (Randomize Questions) and "Acak Pilihan Ganda" (Randomize Options) to the Tryout creation/edit forms.
*   Expose statuses: `Draft`, `Menunggu Persetujuan`, `Butuh Revisi` (shows admin feedback note), `Aktif`.

### 3. Siswa Direct-Start Exam Screen
*   Handle `/siswa/tryout/[id]/start-direct` pathing, auto-submitting the request, showing a loading indicator, and rendering the exam layout cleanly upon redirect.

