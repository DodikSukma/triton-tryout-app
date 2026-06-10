You are a world-class frontend developer specializing in React, Next.js, and interactive content editors. Implement a seamless and user-friendly math equation input system for both teachers (when creating tryout questions) and students (when answering essay questions). 

Additionally, hide all Question Generation by AI functionality as requested by the client.

=============================================================
TARGET FILES & IMPACT AREAS
=============================================================
1. **Teacher Rich Text Editor**: 
   - `frontend/src/components/editor/RichTextEditor.tsx`
2. **Teacher Manage Questions Page**: 
   - `frontend/src/app/(guru)/guru/tryout/[id]/soal/page.tsx`
3. **Student Tryout Exam Page**: 
   - `frontend/src/app/(exam)/exam/[sesiId]/page.tsx`
4. **Student Exam Result Page**: 
   - `frontend/src/app/(siswa)/siswa/hasil/[sesiId]/page.tsx`

=============================================================
FEATURE 1: TEXT SELECTION CONVERSION (TEACHER EDITOR)
=============================================================
**Goal:** Allow teachers to type a math formula as plain text (e.g., `x^2 + y^2 = z^2` or `2/4 + 2/3`), highlight it with their mouse, and convert it instantly into a KaTeX equation. Additionally, allow editing the equations by clicking on them (similar to Microsoft Word).

**Implementation Details inside [RichTextEditor.tsx](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/frontend/src/components/editor/RichTextEditor.tsx):**
- **Selection Listener:** Add a selection listener inside the `contentEditable` div (`onMouseUp` / `onKeyUp` / `onSelectionChange`).
- **Floating Tooltip / Button:**
  - When the user selects a non-empty string inside the editor, display a small floating popup or tooltip near the cursor/selection containing a button: **"Σ Ubah Jadi Persamaan"** (Convert to Equation).
  - Hide this floating button when there is no active text selection.
- **Conversion Logic & Smart Fraction Parsing:**
  - Clicking the button must capture the highlighted text.
  - Clean the text by trimming leading/trailing spaces and stripping any existing `$` or `$$` markers.
  - **Smart Fraction Parsing:** Parse simple text fractions separated by a slash (e.g. `2/4` or `a/b` or `x/y`) and automatically convert them into LaTeX fraction format `\frac{numerator}{denominator}`. For example, selecting `2/4 + 2/3` should automatically yield `\frac{2}{4} + \frac{2}{3}`.
  - Replace the selected range with a KaTeX equation block (`<span class="katex-equation" data-latex="cleaned_latex">...</span>`).
  - Call the existing `katex.renderToString` logic to render the math preview inline immediately.
  - Trigger the `onChange` event to update the state so that the new markup is saved.
  - Keep the editor focus and place the cursor immediately after the converted equation block.
- **Interactive Editing (Word-like click-to-edit):**
  - Make existing equations inside the editor interactive. Clicking on a `.katex-equation` span should capture the click.
  - Retrieve the current LaTeX expression from the span's `data-latex` attribute.
  - Prefill the `EquationDialog` input with this expression and open it.
  - When the teacher updates the equation (e.g. edits the numerator/denominator) and saves, update that exact clicked span with the new LaTeX and rendered HTML instead of inserting a new block.
  - Ensure click handlers are correctly attached/re-attached when loading initial HTML or switching questions.

=============================================================
FEATURE 2: HIDE "GENERATE BY AI" FUNCTIONALITY
=============================================================
**Goal:** Completely hide the AI question generator button and modal from the teacher dashboard.

**Implementation Details inside [page.tsx](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/frontend/src/app/(guru)/guru/tryout/[id]/soal/page.tsx):**
- **Hide Trigger Button:** Comment out or delete the "Generate AI" button (around line 375).
- **Hide Modal Rendering:** Comment out or delete the `<AIGeneratorModal ... />` component rendering (around line 593).
- Ensure all other modals ("Import Soal" and "Import dari Word") continue to function perfectly.

=============================================================
FEATURE 3: EQUATION HELPER & PREVIEW FOR STUDENTS
=============================================================
**Goal:** Assist students in writing mathematical formulas inside the plain essay `<textarea>` and let them preview their answers before submission.

**Implementation Details inside [page.tsx](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/frontend/src/app/(exam)/exam/[sesiId]/page.tsx):**
- **Equation Helper Toolbar:**
  - Place a simple formatting bar directly above the essay `<textarea>`.
  - Add an **"Insert Formula (Σ)"** button.
  - Clicking the button opens a small popup list of common math symbols and templates, such as:
    * Pecahan (`\frac{a}{b}`)
    * Pangkat (`x^2`)
    * Akar (`\sqrt{x}`)
    * Integral (`\int`)
    * Sigma (`\sum`)
    * Custom LaTeX input box with a live math preview.
  - Selecting any template or typing a custom LaTeX formula and clicking "Sisipkan" should insert it at the student's current cursor position in the `<textarea>`, wrapped in single dollar signs (e.g. `$x^2$`).
- **Live Preview Panel:**
  - Add a **"Pratinjau Jawaban"** (Preview Answer) tab or toggle below the `<textarea>`.
  - When enabled, render the student's typed answer using the existing `<RenderHTML>` component.
  - Since `<RenderHTML>` runs `renderMathInElement` (KaTeX auto-render) for any text wrapped in `$...$`, it will compile the student's mathematical formulas and display them beautifully in real-time, giving them confidence in their formatting.

=============================================================
FEATURE 4: RENDER STUDENT EQUATIONS ON RESULTS PAGE
=============================================================
**Goal:** Render the student's math equations properly on the exam results page.

**Implementation Details inside [page.tsx](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/frontend/src/app/(siswa)/siswa/hasil/[sesiId]/page.tsx):**
- **HTML Render:** 
  - Locate the student essay answer display block (around line 228).
  - Replace `<p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.student_answer.jawaban_teks}</p>` with the `<RenderHTML html={item.student_answer.jawaban_teks} className="..." />` component.
  - Since the student's equations are saved inside `jawaban_teks` using the `$formula$` syntax, the `<RenderHTML>` component will automatically compile and render them as beautiful mathematical notation!
