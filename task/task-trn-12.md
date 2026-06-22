# Task TRN-12: Fix Question Import Math Equation Rendering and Segment Admin Master Data by Education Level

## Overview
This task addresses two primary issues:
1. **Imported Math Equation Bugs in Super Try Out**: When importing (comot) questions from the Bank Soal, any existing math equations (LaTeX) are either stripped into plain `[latex]` markers in the builder preview list, or they show up as completely empty editors because the imported questions might only have the `pertanyaan` column populated without `pertanyaan_html`. We will render them beautifully using `<RenderHTML>` and provide editor fallbacks.
2. **Ambiguous Master Data UI**: The Master Data page currently displays SD, SMP, and SMA records all mixed together. We will refactor this page to use a clean tabbed view (SD, SMP, SMA) to segregate the lists and auto-bind the active level during creation.

---

## 📂 Target Files & Impact Areas

### 1. Frontend Client
- `frontend/src/app/(admin-soal)/admin-soal/tryout/[id]/soal/page.tsx` (Super Tryout Builder & Bank Soal modal)
- `frontend/src/app/(admin)/admin/master/page.tsx` (Admin Master Data management page)

---

## ⚙️ Detailed Specifications

### 1. Fix Math Equation Rendering & Editor Fallback in Super Try Out

#### A. Question List Rendering in Builder Page
- Locate the question rendering loop inside `SuperTryoutBuilder` in `frontend/src/app/(admin-soal)/admin-soal/tryout/[id]/soal/page.tsx`.
- Replace the plain stripped text tag:
  ```tsx
  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{stripHtml(s.pertanyaan_html || s.pertanyaan) || '(kosong)'}</p>
  ```
- With the actual `<RenderHTML>` component:
  ```tsx
  <RenderHTML html={s.pertanyaan_html || s.pertanyaan || ''} className="text-sm text-slate-700 dark:text-slate-300" />
  ```
  *(This ensures that any KaTeX equation elements or inline `$...$` patterns are rendered in their true mathematical notation directly on the builder page).*

#### B. Bank Soal Modal Preview
- In the `BankModal` list preview, replace:
  ```tsx
  <p className="text-sm text-slate-700 line-clamp-2">{stripHtml(s.pertanyaan_html || s.pertanyaan)}</p>
  ```
- With:
  ```tsx
  <RenderHTML html={s.pertanyaan_html || s.pertanyaan || ''} className="text-sm text-slate-700" />
  ```
  And do the same for the solution preview (if `s.penyelesaian_html` or `s.penyelesaian` is present).

#### C. RichTextEditor Fallback in QuestionEditorModal
- If a question was imported from Word, it may have raw plain text inside `soal.pertanyaan` containing inline math (e.g. `Solve $x^2 + y^2 = 25$`) but the `soal.pertanyaan_html` field might be `null`.
- In `QuestionEditorModal` props:
  - For the **Pertanyaan** editor, change:
    ```tsx
    initialHtml={soal?.pertanyaan_html ?? ''}
    ```
    to:
    ```tsx
    initialHtml={soal?.pertanyaan_html || soal?.pertanyaan || ''}
    ```
  - For the **Penyelesaian** editor, change:
    ```tsx
    initialHtml={soal?.penyelesaian_html ?? ''}
    ```
    to:
    ```tsx
    initialHtml={soal?.penyelesaian_html || soal?.penyelesaian || ''}
    ```
- This fallback guarantees that the editor never loads blank content when editing imported plain-text questions.

---

### 2. Segment Admin Master Data by Level (SD, SMP, SMA)

#### A. Tabbed Interface Setup
- Modify `frontend/src/app/(admin)/admin/master/page.tsx` to include an active tab selector at the top of the page.
- State:
  ```tsx
  const [activeLevel, setActiveLevel] = useState<EducationLevel>('SD')
  ```
- Render a premium horizontal tab list (SD, SMP, SMA) with corresponding color schemes matching the existing Triton branding:
  - **SD**: Red accent colors.
  - **SMP**: Blue accent colors.
  - **SMA**: Slate/Gray accent colors.

#### B. Dynamic Local Filtering
- Under the tab headers, render the three sections (Kelas, Mata Pelajaran, Sub Mata Pelajaran) in a grid.
- Dynamically filter the items based on the `activeLevel`:
  - **Kelas Section**:
    ```tsx
    const filteredKelas = kelas.filter((k) => k.level === activeLevel)
    ```
  - **Mata Pelajaran Section**:
    ```tsx
    const filteredMapel = mapel.filter((m) => m.level === activeLevel)
    ```
  - **Sub Mata Pelajaran Section**:
    ```tsx
    const filteredSub = sub.filter((s) => s.level === activeLevel)
    ```

#### C. "Tambah" (Add) Modal Auto-selection & Constraint
- When opening the `FormDialog` to add a new record (Kelas or Mata Pelajaran), pass the `activeLevel` as the default level.
- In `FormDialog`, automatically set the state:
  ```tsx
  const [level, setLevel] = useState<EducationLevel>(activeLevel)
  ```
- If the item is added from a filtered tab, disable or hide the level dropdown picker. This ensures that when the user is on the "SMP" tab and clicks "Tambah Kelas", the new class is locked to "SMP" and cannot be mistakenly added to "SD" or "SMA".
- Keep the cascading dropdown for "Tambah Sub Mata Pelajaran" filtered to show only Mata Pelajaran options belonging to the active tab's level (`activeLevel`).

---

## ⚡ Verification Plan
1. **Equation Verification**:
   - Open the Super Tryout Builder.
   - Click "Ambil dari Bank Soal" and check if the math formulas render correctly inside the modal.
   - Import a question, close the modal, and verify the math equation renders properly in the list.
   - Click "Edit" on the imported question and confirm that the text loads in the editor rather than opening empty.
2. **Master Data Tab Verification**:
   - Open `/admin/master`.
   - Click between SD, SMP, and SMA tabs. Verify that lists dynamically filter.
   - Click "Tambah Kelas" while on the SMP tab and confirm the level is locked to SMP.
   - Create a record and verify it only appears under the correct tab.
