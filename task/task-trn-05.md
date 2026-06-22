# 🤖 AI Task: Execute Task TRN-05 - Admin Dashboard Filters, Approvals Navigation, and Builder Back Button

Your task is to execute **Task TRN-05: Admin Dashboard Level Filters, Approvals Redirect, Detailed Admin Question Review, and Guru Back Navigation**. You will refine the admin operational controls, enhance tryout review features, and fix navigation link structures in the teacher workspace.

---

## 🎯 Task Objectives

1.  **Differentiated Level Filters in Admin Dashboard**:
    *   When the Admin selects the level tabs (**SD**, **SMP**, **SMA**) on the Admin Dashboard (`/admin/dashboard`):
        *   **Filter**: Student (`siswa`) count, lists, and tryout statistics.
        *   **Do NOT Filter**: Teacher (`guru`) stats and lists (they must remain global/constant).
2.  **"Lihat Semua" Link Routing**:
    *   In the Admin Dashboard Tryout summary section, change the `"Lihat Semua"` (View All) link action to route directly to the **Tryout Approvals/Persetujuan Screen** (`/admin/approvals` or `/admin/persetujuan`).
3.  **Detailed Tryout Content Review for Admin**:
    *   Enhance the Admin review panel. Admins must be able to inspect the exact details of all questions in a pending tryout (including question texts, formatted LaTeX equations, base64 images, choices A-E with correct answer markers, and essay guidelines) directly from the review interface before approving or requesting a revision.
4.  **Guru Workspace Back Button Navigation**:
    *   In the Guru Tryout Creator/Question Builder workspace (`/guru/tryout/[id]/soal`), ensure that clicking the **"Kembali"** (Back) button routes the teacher cleanly back to the main dashboard (`/guru/dashboard`).

---

## 🏗️ Technical Implementation Details

### 1. Differentiated Dashboard Filtering (`/admin/dashboard`)
*   **State Management**: Keep track of the active tab selection:
    ```typescript
    const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'SD' | 'SMP' | 'SMA'>('ALL');
    ```
*   **Filter Application**:
    *   **Students**: Map students profile level (`education_level` OR parsing class string) and filter student counters and rosters based on `selectedLevel`.
    *   **Tryouts**: Filter tryout counts and details by level.
    *   **Teachers**: Keep the teacher roster list and statistic count unchanged regardless of `selectedLevel`.

### 2. "Lihat Semua" Link Update
Locate the tryout roster component in `/admin/dashboard`. Update the card header action link:
```tsx
// Before:
<Link href="/admin/tryouts">Lihat Semua</Link>

// After:
<Link href="/admin/approvals">Lihat Semua</Link>
```

### 3. Detailed Tryout Content Review Screen (`/admin/approvals` or `/admin/persetujuan`)
Create or expand the review interface:
*   Instead of just displaying a summary line with "Setujui" and "Tolak" buttons, add an **expandable drawer**, **accordion**, or **full dialog review container**.
*   When the Admin clicks a pending tryout, fetch the tryout details along with the full question list (`GET /tryouts/:id`).
*   **Render Details**:
    *   Iterate through questions. Show the question number and text (render HTML and KaTeX formulas).
    *   If `gambar_base64` is populated, render the image.
    *   For `pilihan_ganda`: Render options A-E, clearly highlighting the option marked `is_benar = true` (e.g. green background or checkmark).
    *   For `essay`: Render the `panduan_essay` grading rubric.

### 4. Guru Page Back Navigation (`/guru/tryout/[id]/soal/page.tsx`)
Locate the header navigation container of the question builder page. Update the button handler:
```tsx
// Ensure clicking "Kembali" transitions router:
<button 
  onClick={() => router.push('/guru/dashboard')} 
  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
>
  <ArrowLeft size={16} />
  <span>Kembali ke Dashboard</span>
</button>
```

---

## 🔍 Verification & Acceptance Criteria

1.  **Dashboard Filter**:
    *   Open `/admin/dashboard`. Switch tabs between ALL, SD, SMP, and SMA.
    *   Verify student and tryout numbers change.
    *   Verify teacher statistics do not change.
2.  **Redirect Verification**:
    *   Click `"Lihat Semua"` on the tryout section. Confirm it takes you to `/admin/approvals`.
3.  **Review Detail**:
    *   Go to `/admin/approvals`. Open a pending tryout.
    *   Verify you can see the text and answers of every question before acting on it.
4.  **Guru Back Button**:
    *   Open the question builder `/guru/tryout/[id]/soal`.
    *   Click "Kembali". Verify it redirects to `/guru/dashboard`.
