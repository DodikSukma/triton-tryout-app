# Task TRN-16: Align Standalone Tryout Page & Resolve LaTeX/Equation Editor Bugs

## Overview
This task resolves three critical layout and logic issues in the tryout creation and question builder interfaces:
1. **Tryout Page Alignment**: Align the standalone tryout creation page (`/guru/tryout`) with the dashboard's "Buat Tryout Baru" modal (`TryoutFormDialog` in `/guru/dashboard`) to ensure consistent data cascading and validation rules.
2. **Sidebar Preview Equation Rendering**: Fix the sidebar preview list of questions on the left side of `/guru/tryout/[id]/soal` showing raw LaTeX (like `[x^2]`) instead of rendering formatted math equations.
3. **Auto-parse Raw LaTeX Delimiters in RichTextEditor**: Resolve copy-paste or import issues where equations from the database or external files remain in raw LaTeX format using `$` and `$$` delimiters instead of automatically converting into editable `.katex-equation` spans inside the editor.

---

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(guru)/guru/tryout/page.tsx` (Standalone Tryout Creation Page)
- `frontend/src/app/(guru)/guru/tryout/[id]/soal/page.tsx` (Guru Question Management - sidebar list)
- `frontend/src/components/editor/RichTextEditor.tsx` (Rich Text Editor core parsing)

---

## ⚙️ Detailed Specifications

### 1. Standalone Tryout Page Alignment (Page: `/guru/tryout`)
- **Retrieve Master Data**: Fetch master reference tables on component mount to populate the dropdown lists dynamically:
  - `/master/kelas` (stores class titles)
  - `/master/mata-pelajaran` (stores subjects)
  - `/master/sub-mata-pelajaran` (stores sub-subjects)
- **Cascade Fields and Dropdown options**:
  - **Nama Tryout**: Required text input.
  - **Jenjang**: Required tabs selector (`SD`, `SMP`, `SMA`). On selection change, clear the selected Kelas, Mata Pelajaran, and Sub-Mapel.
  - **Kelas**: Required dropdown containing options matching the selected Jenjang:
    `allKelas.filter(k => k.level === selectedLevel)`
  - **Mata Pelajaran**: Required dropdown containing options matching the selected Jenjang:
    `allMapel.filter(m => m.level === selectedLevel)`
  - **Sub Mata Pelajaran**: Optional dropdown containing options matching the selected Mata Pelajaran:
    `allSub.filter(s => s.mata_pelajaran_id === selectedMapelId)` (disabled if no Mata Pelajaran is selected).
  - **Durasi (menit)**: Number input limited to the `15` to `300` minutes range with step size `5`.
  - **Acak Urutan Soal**: Toggle switch mapping to `randomize_questions` (defaults to `true`).
  - **Acak Pilihan Ganda**: Toggle switch mapping to `randomize_options` (defaults to `true`).
- **Submission Logic**:
  - Set the active education level in cookies/state (`setLevel(form.level.toLowerCase())`) before calling POST `/tryouts`.
  - Validate that Nama, Kelas, and Mata Pelajaran are populated.
  - Construct payload matching:
    ```typescript
    {
      nama_tryout: form.nama_tryout.trim(),
      mata_pelajaran: form.mata_pelajaran,
      sub_mata_pelajaran: form.sub_mata_pelajaran || null,
      kelas: form.kelas || null,
      durasi_menit: form.durasi_menit,
      randomize_questions: form.randomize_questions,
      randomize_options: form.randomize_options,
    }
    ```
  - On success, redirect to `/guru/tryout/${t.id}/soal`.

---

### 2. Sidebar Preview Equation Rendering (Page: `/guru/tryout/[id]/soal`)
- Import `RenderHTML` from `@/components/shared/RenderHTML`.
- In the left sidebar list of questions (around line 462), replace the plain-text paragraph displaying `stripHtmlForPreview(s.pertanyaan_html || s.pertanyaan)` with:
  ```tsx
  <div className="text-xs text-slate-600 line-clamp-2 leading-snug max-h-12 overflow-hidden pointer-events-none">
    <RenderHTML html={s.pertanyaan_html || s.pertanyaan || ''} className="text-xs text-slate-600" />
  </div>
  ```
- This ensures that formulas render beautifully using KaTeX inside the left sidebar list instead of falling back to raw plain-text LaTeX.

---

### 3. Auto-parse Raw LaTeX Delimiters in RichTextEditor (File: `RichTextEditor.tsx`)
- Implement a helper function `convertDelimitersToSpans(html: string): string` to convert raw `$math$` and `$$math$$` delimiters into `.katex-equation` spans.
- Example helper:
  ```typescript
  function convertDelimitersToSpans(html: string): string {
    if (!html) return ''
    // 1. Convert display mode: $$latex$$
    let result = html.replace(/\$\$(.*?)\$\$/gs, (_match, latex) => {
      const cleanLatex = latex.trim()
      try {
        const rendered = katex.renderToString(cleanLatex, { throwOnError: false, displayMode: true })
        return `<span class="katex-equation" contenteditable="false" data-latex="${cleanLatex.replace(/"/g, '&quot;')}" data-display="true">${rendered}</span>`
      } catch {
        return _match
      }
    })
    // 2. Convert inline mode: $latex$
    result = result.replace(/\$(.+?)\$/g, (_match, latex) => {
      if (latex.includes('<') || latex.includes('>') || latex.includes('\n')) return _match
      const cleanLatex = latex.trim()
      try {
        const rendered = katex.renderToString(cleanLatex, { throwOnError: false, displayMode: false })
        return `<span class="katex-equation" contenteditable="false" data-latex="${cleanLatex.replace(/"/g, '&quot;')}" data-display="false">${rendered}</span>`
      } catch {
        return _match
      }
    })
    return result
  }
  ```
- In the `useEffect` block initializing HTML on mount, and inside `setHtml` within `useImperativeHandle`, pass the incoming HTML through the `convertDelimitersToSpans` helper before applying it to `editorRef.current.innerHTML`.
- This ensures any pasted text or imported questions using standard `$` or `$$` format are automatically parsed and editable as visual KaTeX equation blocks.

---

## ⚡ Verification Plan
1. **Tryout Form Verification**: Access `/guru/tryout` and verify the Jenjang, Kelas, Mapel, and Sub-Mapel dropdown cascade. Check validation and creation.
2. **Sidebar Preview Verification**: Create or edit questions containing equations. Confirm that the equations display rendered mathematical symbols in the left list of questions, matching standard KaTeX rendering.
3. **LaTeX Auto-Conversion Verification**: Edit a question, paste text containing `$x^2 + y^2 = r^2$`, save it, or import a tryout. Open the editor and verify that the equation is converted to a clickable/editable `.katex-equation` span, and displays formatted math on the screen.
