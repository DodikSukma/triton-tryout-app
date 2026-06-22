# Task TRN-10: Implement Question Solutions, Question Codes, and Super Try Out with 'admin-soal' Role

## Overview
This task aims to implement a comprehensive Question Bank management system, adding solutions/explanations to questions, introducing unique Question Codes, adding a new `'admin-soal'` administrative role, and implementing a "Super Try Out" builder where the `'admin-soal'` can compile tryouts using questions sourced from other teachers across different subjects and grades.

---

## 📂 Target Files & Impact Areas

### 1. Database & Seeding Scripts
- `scripts/db-init.ts` (Database schema runner reference)
- `services/auth-service/src/db/schema.sql` (Auth schema check constraints)
- `services/user-service/src/db/schema.sql` (User audit log check constraints)
- `services/sd-service/src/db/schema.sql` (SD question and tryout schemas)
- `services/smp-service/src/db/schema.sql` (SMP question and tryout schemas)
- `services/sma-service/src/db/schema.sql` (SMA question and tryout schemas)
- `scripts/seed.ts` (For default `admin-soal` credentials and dummy questions)

### 2. Backend Services & API Gateway
- `services/api-gateway/src/index.ts` (Gateway level guards and proxy paths)
- `services/api-gateway/src/middleware/auth.middleware.ts` (Role-based authentication helpers)
- `services/sd-service/src/routes/tryout.routes.ts` (SD endpoint handlers for compiling questions)
- `services/smp-service/src/routes/tryout.routes.ts` (SMP endpoint handlers)
- `services/sma-service/src/routes/tryout.routes.ts` (SMA endpoint handlers)

### 3. Frontend Client
- `frontend/src/middleware.ts` (Next.js route middleware for routing the new role)
- `frontend/src/components/editor/RichTextEditor.tsx` (Adding solution input using math editor)
- `frontend/src/app/(siswa)/siswa/hasil/[sesiId]/page.tsx` (Displaying solutions to students)
- `frontend/src/app/(guru)/guru/tryout/[id]/soal/page.tsx` (Teacher question form modifications)
- **New Directory & Pages**:
  - `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx` (Dashboard for admin-soal)
  - `frontend/src/app/(admin-soal)/admin-soal/tryout/[id]/soal/page.tsx` (Super Try Out builder with Bank Soal importing module)

---

## ⚙️ Detailed Specifications

### 1. Database Schema Updates (Migration)

#### A. Auth & User Services
- **`services/auth-service/src/db/schema.sql`**:
  - Update the check constraint on the `users` table for the `role` column to allow `'admin-soal'`.
  - SQL update:
    ```sql
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'guru', 'siswa', 'admin-soal'));
    ```
- **`services/user-service/src/db/schema.sql`**:
  - If there is any check constraint on audit logs, update it to include `'admin-soal'`.

#### B. SD, SMP, SMA Services
Apply these schema changes to the databases `db_sd`, `db_smp`, and `db_sma`:

> [!IMPORTANT]
> The database migration script `scripts/db-init.ts` runs the SQL scripts with `CREATE TABLE IF NOT EXISTS`, which will NOT apply new columns to already existing tables.
> Therefore, you MUST add explicit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` statements in `schema.sql` (under each service's `src/db/` folder) to update tables in the local Docker environment without losing existing data.

- **`soal` Table**:
  - Add `kode_soal` `VARCHAR(100)` to uniquely identify questions.
    - SQL: `ALTER TABLE soal ADD COLUMN IF NOT EXISTS kode_soal VARCHAR(100);`
  - Add `penyelesaian` `TEXT` (raw markdown/plain text for explanations).
    - SQL: `ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian TEXT;`
  - Add `penyelesaian_html` `TEXT` (rendered HTML containing math equations).
    - SQL: `ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_html TEXT;`
  - Add `penyelesaian_gambar_url` `TEXT` (optional solution image URL).
    - SQL: `ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_gambar_url TEXT;`
  - Add `penyelesaian_gambar_base64` `TEXT` (optional solution base64 image data).
    - SQL: `ALTER TABLE soal ADD COLUMN IF NOT EXISTS penyelesaian_gambar_base64 TEXT;`
- **`tryouts` Table**:
  - Add `is_super_tryout` `BOOLEAN NOT NULL DEFAULT false` (to mark compiled tryouts by `admin-soal`).
    - SQL: `ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS is_super_tryout BOOLEAN NOT NULL DEFAULT false;`

---

### 2. Backend Services & Gateway Routing

#### A. API Gateway & Microservices Role Access
- Update `services/api-gateway/src/index.ts` to allow `admin-soal` to access routes for:
  - Tryout creation, editing, deleting, and publishing.
  - Soal management.
  - Approval and review endpoints (so `admin-soal` can approve tryouts submitted by teachers).
- Allow `admin-soal` to fetch all questions (across different tryouts) by implementing a bank-soal filter endpoint.
- > [!IMPORTANT]
  > Ensure you also update the backend microservice route handlers (e.g., `services/sd-service/src/routes/tryout.routes.ts`, `services/smp-service/src/routes/tryout.routes.ts`, and `services/sma-service/src/routes/tryout.routes.ts`) where queries filter or authorize based on `role === 'admin'`. Update these queries to also grant visibility and permissions to `role === 'admin-soal'` (e.g., `role === 'admin' || role === 'admin-soal'`).

#### B. Question Bank (Bank Soal) API Endpoints
- Implement an endpoint `/soal/bank` (under SD, SMP, and SMA services respectively) that allows searching/filtering of questions:
  - Allowed roles: `admin`, `admin-soal`.
  - Query parameters: `mata_pelajaran`, `kelas`.
  - The service should query the `soal` table joined with the `tryouts` table to return all questions matching the filters.
  - It should output questions, options, code, and solution content.

#### C. Super Try Out Compilation Endpoint
- Create an API endpoint `/tryouts/:id/import-questions` under SD/SMP/SMA services:
  - Payload: `{ questionIds: string[] }`
  - Logic: Fetch the questions from the database, duplicate them, generate new IDs, and associate them with the target `tryout_id` (the Super Try Out).
  - This ensures that updating or deleting the original teacher's question does not alter the historical or operational state of the Super Try Out.

---

### 3. Frontend Implementation Details

#### A. RichTextEditor & Question Form Changes (Teacher/Admin View)
- In the question creation/editing modal/form:
  - Add a **"Kode Soal"** text input. If left empty, auto-generate a unique code (e.g., `SOAL-[RANDOM-STRING]`).
  - Add a **"Penyelesaian Soal"** editor. This must use the same `RichTextEditor` component that renders LaTeX formulas and uploads images.
  - Submit the additional fields (`kode_soal`, `penyelesaian`, `penyelesaian_html`, etc.) to the respective endpoints.

#### B. Student Tryout Result Page
- In `frontend/src/app/(siswa)/siswa/hasil/[sesiId]/page.tsx`:
  - Locate each question display block.
  - Below the correct answer and student's answer, render a beautiful card labeled **"Penyelesaian / Pembahasan Soal"**.
  - Use the `<RenderHTML html={item.soal.penyelesaian_html} />` component to render the math equations, solutions, and illustrations beautifully.
  - Hide this panel if the solution HTML is empty.

#### C. `admin-soal` Next.js Middleware & Dashboard
- **Middleware**:
  - Update `frontend/src/middleware.ts` to handle the `admin-soal` role.
  - Redirect `admin-soal` users to `/admin-soal/dashboard` upon login.
  - Restrict access to `/admin-soal/*` paths to only users with `role === 'admin-soal'`.
- **Dashboard (`/admin-soal/dashboard`)**:
  - Show overview metrics (Total Super Tryouts, Total Teacher Tryouts Pending Approval).
  - Show a list of submitted tryouts from teachers waiting for approval, with "Approve", "Reject", and "Review / Comment" action flows.
  - Show a list of Super Tryouts created by the `admin-soal`.

#### D. Super Try Out Builder Page
- In the Super Try Out manager page (for creating/editing a Super Try Out):
  - Add a button: **"Ambil dari Bank Soal"** (Import from Question Bank).
  - Clicking this opens a Modal featuring:
    1. **Filters**: Category selectors for Mata Pelajaran (Subject) and Kelas/Grade.
    2. **Grid / List**: Lists matching questions found in the selected level's bank. Display `kode_soal`, a short preview of the question, and its solution.
    3. **Selection**: Checkboxes to select multiple questions.
    4. **Action**: An "Import Soal" button that calls the backend duplicate endpoint and adds them into the current Super Try Out dynamically.
  - Ensure questions inside a Super Try Out can also be edited or created from scratch directly.
  - A Super Try Out bypasses the teacher-approval workflow and is automatically marked as `approved` / `published` when the `admin-soal` publishes it.

---

## 📊 Seed Data Requirements
Update `scripts/seed.ts` to include:
1. One default `admin-soal` user:
   - **Email**: `adminsoal1@triton.id`
   - **Password**: `adminsoal123`
   - **Role**: `admin-soal`
2. Sample math/science questions containing dummy solutions (with KaTeX equations like `\frac{a}{b}`) and unique Question Codes (e.g., `MTK-SMA-001`) to pre-populate the Question Bank.

---

## ⚡ Verification Plan
1. **Database Migration Check**: Run `make db-init` and verify that the `users` constraint is updated, and columns (`kode_soal`, `penyelesaian`, `is_super_tryout`) are successfully added to tables across all databases (`db_sd`, `db_smp`, `db_sma`).
2. **Login Flow**: Log in as `adminsoal1@triton.id` and ensure Next.js middleware routes the user correctly to `/admin-soal/dashboard`.
3. **Super Try Out Builder**: Create a Super Try Out, search the Question Bank using filters, import 5 questions, verify duplication, and confirm that editing them does not affect the original source tryouts.
4. **Student Explanation Check**: Take a tryout as a student, finish the exam, navigate to the results page, and verify that the KaTeX formula and solution details are displayed perfectly.
