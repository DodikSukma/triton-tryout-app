# Task TRN-18: Admin Soal Question Inspection, Search, and Pagination

## Overview
This task resolves usability gaps for the **Admin** and **Admin Soal** tryout verification workflows:
1. **Admin Soal Question Inspection**: Enable `admin-soal` to inspect the detailed questions list (including correct answers, options, and explanations) of teacher-submitted tryouts before approving or rejecting them.
2. **Search Filtering**: Add search inputs on both `/admin/approvals` and `/admin-soal/dashboard` to filter tryout lists dynamically.
3. **Pagination**: Implement pagination controls (e.g. 5 or 10 items per page) on both pages to handle large datasets efficiently.

---

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(admin)/admin/approvals/page.tsx` (Admin approvals page)
- `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx` (Admin Soal dashboard page)

---

## ⚙️ Detailed Specifications

### 1. Question Inspection for Admin Soal (File: `admin-soal/dashboard/page.tsx`)
- Implement expandable content under each tryout card in the "Tryout Guru Menunggu Persetujuan" list.
- Add local states for managing expansions:
  ```typescript
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, TryoutDetail>>({})
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  ```
- When a user clicks **"Lihat Soal"** on a pending tryout card:
  - If collapsed, fetch detailed tryout data from:
    `levelPath(`/tryouts/${t.id}`, t.level)`
  - Re-use or replicate the `SoalReview` helper component (using `RenderHTML`) to render the question numbers, types (PG/Essay), base64 images, multiple-choice options with marked correct answers (`*`), and markdown solutions.

---

### 2. Search & Pagination in Admin Approvals (File: `admin/approvals/page.tsx`)
- Add state variables:
  ```typescript
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  ```
- **UI Search Input**: Add a search bar at the top of the list labeled `"Cari Persetujuan Ujian..."` to search by `nama_tryout`, `mata_pelajaran`, or `kelas`.
- **Filtering & Pagination Math**:
  - Filter the list:
    ```typescript
    const filtered = tryouts.filter(t => 
      t.nama_tryout.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mata_pelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.kelas && t.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    ```
  - Slice the filtered list for display:
    ```typescript
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    ```
- **Pagination Controls**: Render "Sebelumnya" (Prev) and "Berikutnya" (Next) buttons, alongside active page indicators. Reset `currentPage` to `1` whenever `searchQuery` changes.

---

### 3. Search & Pagination in Admin Soal (File: `admin-soal/dashboard/page.tsx`)
- Add separate search inputs and pagination states for:
  - **Tryout Guru Menunggu Persetujuan** (Pending list)
  - **Super Try Out Saya** (Created list)
- Configure `itemsPerPage = 5` for both lists.
- Display clean, responsive search boxes with matching icon layouts, and render pagination buttons underneath each table list.

---

## ⚡ Verification Plan
1. **Admin Soal Detail Inspection**: Log in as `adminsoal1@triton.id`. In the pending list, click "Lihat Soal" on a card. Verify that the questions render correctly showing the correct options.
2. **Search Verification (Admin & Admin Soal)**: Type keywords into the search fields on `/admin/approvals` and `/admin-soal/dashboard`. Confirm that the respective lists filter instantly.
3. **Pagination Verification (Admin & Admin Soal)**: Seed multiple tryouts so that the counts exceed 5. Confirm that pagination controls appear, that page clicks slice lists correctly, and that search queries reset pages back to 1.
