# 🤖 AI Task: Execute Task TRN-31 - Fix Teacher Access to Super Try Out Analytics

## 🎯 Task Objective
Resolve the access control flow on the Teacher (`guru`) Dashboard so that teachers can view student test results and performance analytics for official Try Outs (**Super Try Outs**) compiled by the `admin-soal` / `admin` that match their taught subject. Currently, because teachers did not author these tryouts, the system evaluates `isMine` as `false` and completely locks them out.

---

## 📂 Target Files & Impact Areas

### 1. Frontend Client
- `frontend/src/app/(guru)/guru/dashboard/page.tsx` (Dashboard view adjustments, fetching teacher profile, adjusting `TryoutCard` props, and results/analytics toggles)

---

## ⚙️ Detailed Specifications

### 1. Fetch Teacher Profile for Subject Comparison
- In `frontend/src/app/(guru)/guru/dashboard/page.tsx`, import and use the `useProfile` hook or call `/users/profile/me` directly to get the current teacher's profile.
- Extract `profile.mata_pelajaran` (which contains comma-separated taught subjects, e.g., `"Matematika"` or `"Matematika, Fisika"`).

### 2. Update TryoutCard and Result Toggle Logic
- Modify `TryoutCard` props to accept the teacher's profile or taught subjects.
- Define a new helper variable or prop: `canViewResults`.
  - A teacher should be able to view student results/analytics if:
    - `isMine === true` (They created the Bank Soal)
    - **OR** `tryout.is_super_tryout === true` AND the tryout's `mata_pelajaran` is included in the teacher's taught subjects (`profile.mata_pelajaran`).
- Adjust the card's actions and dropdown options:
  - If `isMine` is `false` but `canViewResults` is `true`:
    - Show the options menu dropdown "⋯" but **only** render the **"Lihat Hasil Siswa"** link. Do not render edit, delete, or manage questions options.
    - Change the main card button to redirect to the results page: `/guru/tryout/${t.id}/hasil`.
    - Enable the **"Peserta" toggle row** at the bottom of the card, allowing the teacher to collapse/expand the student score table.
  - If both `isMine` and `canViewResults` are `false` (e.g. another teacher's Bank Soal), keep the card fully read-only and locked.

---

## ⚡ Verification & Acceptance Criteria
1. **Verification of Normal Bank Soal**:
   - Ensure the teacher can manage, edit, delete, and view results for their own Bank Soal (`isMine === true`).
   - Ensure other teachers' Bank Soal of the same subject remain locked for editing, deleting, and results monitoring (displays "Hanya lihat — bank soal guru lain").
2. **Verification of Super Try Out Access**:
   - Log in as a teacher (e.g., `guru1@triton.id` teaching Mathematics).
   - Ensure that any official Try Out (where `is_super_tryout` is `true` and subject is `"Matematika"`) displays a main button for "Lihat Hasil Siswa" and enables the collapsible student result panel.
   - Verify that clicking "Lihat Hasil Siswa" successfully redirects the teacher to `/guru/tryout/[id]/hasil`.
   - Verify that the options to edit, delete, or manage questions for the Super Try Out are completely hidden.
