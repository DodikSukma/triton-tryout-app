# Task TRN-14: Refine Super Tryout Creation, Datalist Selectors, Master Data Search, and Question Bank Code Search

## Overview
This task resolves four critical bugs/gaps identified in the Question Bank search, Tryout creation, and Master Data management interfaces to polish the user experience:
1. **Super Try Out Auto-Publishing**: When created by `admin-soal` (or marked as `is_super_tryout`), tryouts must bypass the `'draft'` status and be created directly as `'published'`.
2. **Strict Dropdowns for Tryout Creation**: Replace manual text inputs (datalists) in the Super Try Out creation modal with strict `<select>` dropdowns. Make both Subject and Class mandatory fields.
3. **Master Data Search Bar**: Add a text search input on the Admin Master Data page to quickly find existing classes/subjects.
4. **Question Bank Code & Keyword Search**: Enable searching questions in the Bank Soal modal by their unique `kode_soal` or question text.

---

## 📂 Target Files & Impact Areas

### 1. Backend Microservices
- `services/sd-service/src/routes/tryout.routes.ts` (Auto-publish logic)
- `services/smp-service/src/routes/tryout.routes.ts` (Auto-publish logic)
- `services/sma-service/src/routes/tryout.routes.ts` (Auto-publish logic)
- `services/sd-service/src/routes/soal.routes.ts` (GET /bank keyword filter)
- `services/smp-service/src/routes/soal.routes.ts` (GET /bank keyword filter)
- `services/sma-service/src/routes/soal.routes.ts` (GET /bank keyword filter)

### 2. Frontend Client
- `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx` (Super Tryout Creation Form validation & selects)
- `frontend/src/app/(admin)/admin/master/page.tsx` (Admin Master Data search filtering)
- `frontend/src/app/(admin-soal)/admin-soal/tryout/[id]/soal/page.tsx` (Bank Soal search bar & API sync)

---

## ⚙️ Detailed Specifications

### 1. Super Tryout Auto-Publishing (Backend Services)
- In the POST `/tryouts` route handler of `sd-service`, `smp-service`, and `sma-service` (`routes/tryout.routes.ts`):
  - Check if `body.is_super_tryout` is `true` OR if the caller's role `req.headers['x-user-role']` is `'admin-soal'`.
  - When inserting the tryout, set its database `status` column to `'published'` directly (instead of defaulting to `'draft'`).
  - Example logic:
    ```typescript
    const defaultStatus = (body.is_super_tryout || req.headers['x-user-role'] === 'admin-soal') ? 'published' : 'draft';
    // Insert with status = defaultStatus
    ```

### 2. Strict Select Dropdowns & Mandated Inputs in Super Tryout Modal (Frontend)
- In `CreateSuperTryoutModal` inside `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx`:
  - **Mata Pelajaran (Subject)** input:
    - Replace the `<input list="mapel-options" />` with a `<select>` dropdown element.
    - Map `mapelOptions` into `<option>` tags. Include a blank placeholder like `Select Subject`.
  - **Kelas (Class)** input:
    - Replace the `<input list="kelas-options" />` with a `<select>` dropdown element.
    - Map `kelasOptions` into `<option>` tags.
  - **Validation Constraints**:
    - Remove `(opsional)` from the class label. Both Mata Pelajaran and Kelas are now **mandatory** for Super Tryouts.
    - In the `submit()` function, validate that both fields are selected:
      ```typescript
      if (!nama.trim() || !mapel.trim() || !kelas.trim()) {
        toast.error('Nama, Mata Pelajaran, dan Kelas wajib diisi.');
        return;
      }
      ```

### 3. Search Filter in Admin Master Data
- In `frontend/src/app/(admin)/admin/master/page.tsx`:
  - Add a state variable: `const [searchQuery, setSearchQuery] = useState('')`.
  - Add a styled text search input at the top of the page (below the header):
    ```tsx
    <input
      type="text"
      placeholder="Cari kelas, mata pelajaran, atau sub-mata pelajaran..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="..."
    />
    ```
  - Apply the search query filter to the displayed lists locally in the UI:
    - `filteredKelas.filter(k => k.nama.toLowerCase().includes(searchQuery.toLowerCase()))`
    - `filteredMapel.filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase()))`
    - `filteredSub.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.mata_pelajaran_nama?.toLowerCase().includes(searchQuery.toLowerCase()))`

### 4. Search Question Bank by Code and Keywords
- **Backend Services**:
  - In GET `/bank` route of `routes/soal.routes.ts` in `sd-service`, `smp-service`, and `sma-service`:
    - Retrieve query parameter: `const search = (req.query.search as string | undefined)?.trim();`
    - If `search` is provided, append a condition to the `where` constraints:
      ```typescript
      if (search) {
        params.push(`%${search}%`);
        conds.push(`(s.kode_soal ILIKE $${params.length} OR s.pertanyaan ILIKE $${params.length})`);
      }
      ```
- **Frontend Client**:
  - In `BankModal` inside `frontend/src/app/(admin-soal)/admin-soal/tryout/[id]/soal/page.tsx`:
    - Add a state variable: `const [searchQuery, setSearchQuery] = useState('')`.
    - Render a text input field in the modal filters section labeled `"Cari Kode Soal / Kata Kunci"`.
    - In the `search()` fetch function, read `searchQuery` and append it as `search` to the API URL search parameters:
      ```typescript
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      ```

---

## ⚡ Verification Plan
1. **Auto-publish Verification**: Create a new Super Tryout as `admin-soal`. Check the list on the dashboard and confirm the badge displays `Aktif` / `published` immediately, and it doesn't require admin approvals.
2. **Dropdown Verification**: Open the Super Tryout creation modal, verify that Mata Pelajaran and Kelas are select dropdowns and that trying to create a tryout with any field left empty yields a toast validation error.
3. **Master Data Search Verification**: Navigate to `/admin/master`, type a keyword in the search bar, and verify that the sections filter instantly.
4. **Question Bank Search Verification**: Open the Question Bank in the Super Tryout editor, type a known `kode_soal` or query keyword, click "Cari", and check that the list is filtered correctly.
