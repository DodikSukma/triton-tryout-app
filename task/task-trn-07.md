# 🤖 AI Task: Execute Task TRN-07 - Student Level Access, CBT Proctoring System, and Results Contrast

Your task is to execute **Task TRN-07: Akses Try Out Berdasarkan Role Siswa, Sistem Proteksi Kecurangan (Anti-Cheating), dan Peningkatan Kontras Hasil Try Out**. You will implement class-level exam filters, build a comprehensive browser-based proctoring/anti-cheating guard, and fix color contrast legibility on the tryout results screen.

---

## 🎯 Task Objectives

1.  **Class-Level Tryout Filters**:
    *   Control student access so that they only see tryouts matching their assigned education level (SD, SMP, SMA) and specific class (e.g. '12 SMA' or 'XII IPA 1').
2.  **Anti-Cheating Proctoring Engine**:
    *   Enforce a secure CBT sandbox on the exam workstation (`/siswa/tryout/[id]/kerjakan`):
        *   **Fullscreen Lock**: Require fullscreen mode; show a blocking warning overlay if they exit.
        *   **Focus Loss & Tab Switch Detection**: Log violations when the window is blurred or the tab is switched. Trigger auto-submission upon exceeding limits (e.g., 3 warnings).
        *   **Copy-Paste & Copying Lock**: Disable text copying, pasting, text cutting, context menus, and text selections.
3.  **Results Screen Contrast Enhancement**:
    *   Perfect the readability on the tryout results screen (`/siswa/hasil/[sesiId]`). Replace low-contrast white fonts on light gradient backdrops with legible, high-contrast Slate/Navy text or solid cards.

---

## 🏗️ Technical Implementation Details

### 1. Class-Level Tryout Filters (Level Services & Gateway)
*   **Database Query Filtering**:
    When a student fetches available tryouts (`GET /tryouts/available` or level service equivalents `/sd/tryouts/available` etc.):
    1.  The Gateway forwards the student's profile information, specifically their assigned class (`profiles.kelas` e.g., '12 SMA') as headers: `x-user-class`.
    2.  The level-specific microservices filter the queries to database:
        ```sql
        -- Retrieve tryouts matching the student's level database AND assigned class
        SELECT * FROM tryouts 
        WHERE status = 'published' 
          AND (kelas = $1 OR kelas IS NULL) -- NULL represents universal level tryouts
        ORDER BY created_at DESC;
        ```
    3.  This prevents a 10th-grade student from seeing or sitting for a 12th-grade tryout.

### 2. Browser-Based Proctoring / Anti-Cheating Sandbox
Implement these listeners inside the exam cockpit view (`frontend/src/app/(siswa)/siswa/tryout/[id]/kerjakan/page.tsx`):

#### A. Fullscreen Guard
*   On entering the exam, display a modal dialog: `"Untuk memulai ujian, Anda harus masuk ke mode layar penuh"`. Clicking `"Masuk Layar Penuh"` triggers the Fullscreen API: `document.documentElement.requestFullscreen()`.
*   Listen to fullscreen state transitions (`fullscreenchange` event):
    ```typescript
    document.onfullscreenchange = () => {
      if (!document.fullscreenElement) {
        // Exited fullscreen -> Display a blocking alert overlay
        // and disable exam inputs until they re-enter fullscreen
      }
    };
    ```

#### B. Tab Switching & Window Blur Warnings
*   Track warning count in component state: `const [warnings, setWarnings] = useState(0)`.
*   **Visibility Change**:
    ```typescript
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        incrementWarning("Anda dilarang berpindah tab selama ujian!");
      }
    });
    ```
*   **Window Blur (Focus Loss)**:
    ```typescript
    window.addEventListener('blur', () => {
      incrementWarning("Layar ujian kehilangan fokus!");
    });
    ```
*   **Disqualification Limit**:
    If warnings exceed `3`, trigger the auto-submission sequence immediately:
    *   Call `POST /sesi/:sesiId/selesai` with metadata indicating disqualification (`status: 'timeout'`).
    *   Redirect them out of the exam screen to a disqualified notice screen.

#### C. Clipboard & Interaction Disabling
Disable copy/paste operations and text selection:
*   **Event Interceptors**:
    ```typescript
    window.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('copy', e => e.preventDefault());
    window.addEventListener('cut', e => e.preventDefault());
    window.addEventListener('paste', e => e.preventDefault());
    ```
*   **Tailwind Styles**: Apply selection blockers globally on the question content container:
    ```html
    <div className="select-none pointer-events-none">
       {/* Question content */}
    </div>
    ```

---

### 3. Results UI Contrast Refactoring (`/siswa/hasil/[sesiId]`)
Fix legibility issues on the results dashboard screen where white text overlaps with light backgrounds.
*   **Contrast Refactoring**:
    *   Locate the Score Hero Card container. If it uses a colored gradient background, change the text classes:
        *   Instead of light/white fonts on light gradients, overlay text with solid slate colors: `text-slate-900` or `text-slate-800`.
        *   Alternatively, wrap scores and metadata inside a high-contrast container with deep drop shadows:
            ```tsx
            <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-slate-100 rounded-2xl p-6 text-slate-900">
               {/* High contrast score details */}
            </div>
            ```
    *   Ensure all typography text colors on the results details breakdown (correct options, weight, and student answers) conform to WCAG contrast standards.

---

## 🔍 Verification & Acceptance Criteria

1.  **Access Restriction**:
    *   Log in as a student with `kelas = '10 SMA'`. Ensure you do *not* see tryouts created for `12 SMA` in the dashboard or tryout list view.
2.  **Anti-Cheating Enforcement**:
    *   Start an exam. Exit fullscreen mode. Verify a blocking overlay covers the exam questions.
    *   Attempt to copy text or right-click. Ensure it is blocked.
    *   Switch tabs or blur the window. Confirm warning alerts are displayed.
    *   Exceed 3 focus violations. Verify the exam is automatically submitted and locked.
3.  **UI Verification**:
    *   View the final results screen. Confirm all texts, scores, correct option labels, and grades are easily readable with high contrast colors.
