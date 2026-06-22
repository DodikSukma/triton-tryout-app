# 🤖 AI Task: Execute Task TRN-03 - Upload Bank Soal via MS Word (.docx)

Your task is to execute **Task TRN-03: Create or Upload Bank Soal via MS Word Format**. You will implement an administrative master data system for subjects, sub-subjects, and classes, update the tryout creation flow to restrict levels dynamically, and build an automated parser for Microsoft Word (.docx) documents so teachers can batch upload questions.

---

## 🎯 Task Objectives

1.  **Master Data Registry**:
    *   Enable Administrators (`admin`) to register and manage master records for:
        *   **Mata Pelajaran (Subjects)** (e.g. Matematika, Fisika, IPA).
        *   **Sub Mata Pelajaran (Sub-Subjects)** (e.g. Aljabar, Mekanika, Fotosintesis).
        *   **Kelas (Classes)** (e.g. 6 SD, 9 SMP, 10 SMA, 12 SMA).
2.  **Strict Selection on Tryout Creation**:
    *   Update the tryout creation form so teachers (`guru`) select from the administrative master data dropdowns. This aligns tryouts to specific educational level services (`sd-service`, `smp-service`, or `sma-service`).
3.  **MS Word (.docx) Parser**:
    *   Implement an automated parser using `mammoth` (for docx-to-HTML text conversion) that reads structured tryout question templates from uploaded files, maps options, correct answers, weightings, and batch inserts them.

---

## 🗄️ Database Schemas Update

Add master tables to the centralized `db_user` database (handled via `user-service` migrations):

```sql
CREATE TABLE IF NOT EXISTS master_kelas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       VARCHAR(50) UNIQUE NOT NULL,
  level      VARCHAR(10) NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA'))
);

CREATE TABLE IF NOT EXISTS master_mata_pelajaran (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       VARCHAR(100) UNIQUE NOT NULL,
  level      VARCHAR(10) NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA'))
);

CREATE TABLE IF NOT EXISTS master_sub_mata_pelajaran (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_pelajaran_id UUID NOT NULL REFERENCES master_mata_pelajaran(id) ON DELETE CASCADE,
  nama              VARCHAR(100) NOT NULL,
  UNIQUE(mata_pelajaran_id, nama)
);
```

Add reference columns to the level-specific `tryouts` tables (`db_sd`, `db_smp`, `db_sma` databases):
*   Add column `sub_mata_pelajaran` (VARCHAR) or `sub_mata_pelajaran_id` (UUID).
*   Add column `kelas` (VARCHAR) or `kelas_id` (UUID).

---

## 📑 MS Word (.docx) Formatting & Assets Specifications

Define a strict template structure for the Word document to ensure deterministic parsing:

```text
[SOAL]
Tipe: pilihan_ganda
Bobot: 2
Pertanyaan: Jika fungsi f ditentukan oleh $$f(x) = 2x^2 - 3x + 5$$, tentukan nilai dari $$f(3)$$!
A. 11
B. 12
C. 13
*D. 14
E. 15

[SOAL]
Tipe: pilihan_ganda
Bobot: 3
Pertanyaan: Perhatikan gambar hewan di bawah ini. Apakah jenis organel sel utama yang terdapat pada organ sel respirasinya?
[IMAGE_1]
A. Kloroplas
*B. Mitokondria
C. Ribosom
D. Lisosom

[SOAL]
Tipe: essay
Bobot: 5
Pertanyaan: Buktikan teorema Pythagoras $$a^2 + b^2 = c^2$$!
Rubrik: Bukti matematis segitiga siku-siku dengan luas persegi pada sisi miring sama dengan jumlah luas persegi pada kedua sisi tegaknya.
```

### 🧮 Mathematical Equations Handling
*   **Word Input Format**: Equations must be written as LaTeX strings wrapped inside double dollar signs for block equations (e.g., `$$x^2 + y^2 = r^2$$`) or single dollar signs for inline math (e.g., `$x = 3$`). 
*   **Parser Action**: 
    1.  The parser scans the text for `$$...$$` or `$...$` patterns.
    2.  It extracts the mathematical LaTeX content (e.g., `x^2 + y^2 = r^2`) and populates the `equation_latex` and `equation` fields in the `soal` table.
    3.  The text in `pertanyaan_html` retains the math notation wrapped in delimiters, ensuring that the frontend renders it correctly using **react-katex** / **KaTeX**.

### 🖼️ Image Extraction Handling
*   **Word Input Format**: Place inline images directly into the document (for instance, under the question text block).
*   **Parser Action**:
    1.  Configure the `mammoth` parser options using a custom image converter:
        ```javascript
        const options = {
          convertImage: mammoth.images.inline((element) => {
            return element.read("base64").then((imageBuffer) => {
              return {
                src: `data:${element.contentType};base64,${imageBuffer}`
              };
            });
          })
        };
        ```
    2.  When parsing a `[SOAL]` block, search the converted HTML paragraphs for `<img src="data:image/...;base64,...">` tags.
    3.  Extract the base64 string from the `src` attribute and write it to the `gambar_base64` database column in the `soal` table.
    4.  Clean the `pertanyaan_html` markup by removing the raw base64-encoded `<img>` tag and replacing it with a standardized tag (e.g., `<img class="tryout-question-image" src="/api/placeholder" />`) to prevent storing massive HTML strings directly in the question paragraph.


---

## 📡 API Endpoints

### 1. Master Data CRUD (user-service / Port 4002)
*   `GET /master/kelas` | `POST /master/kelas` | `DELETE /master/kelas/:id`
*   `GET /master/mata-pelajaran` | `POST /master/mata-pelajaran` | `DELETE /master/mata-pelajaran/:id`
*   `GET /master/sub-mata-pelajaran` | `POST /master/sub-mata-pelajaran` | `DELETE /master/sub-mata-pelajaran/:id`

### 2. Batch Word Upload (Level Services: Port 4005, 4006, 4007)
*   **Method & Route**: `POST /tryouts/:id/upload-docx`
*   **Headers**: `Content-Type: multipart/form-data`
*   **Process**:
    1.  Receives file and parses it using `mammoth`.
    2.  Extracts paragraphs, options, rubrics, and embedded image buffers.
    3.  Validates that every `pilihan_ganda` block has A-E options and exactly one correct answer prefix (`*`).
    4.  Runs a database transaction inserting record sets into `soal` and `opsi_jawaban`.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "15 questions uploaded successfully.",
      "data": null
    }
    ```

---

## 💻 Frontend Implementation Specifications

### 1. Admin Master Settings Dashboard (`/admin/master`)
*   Create a management portal for admins to add or remove classes, subjects, and link sub-subjects via modal forms.

### 2. Restricted Tryout Creator (`/guru/dashboard`)
*   Replace the tryout creation dialog text fields with cascade dropdown selectors:
    *   **Level Selector** (SD, SMP, or SMA).
    *   **Kelas Selector** (Filters classes matching selected level).
    *   **Mata Pelajaran Selector** (Filters subjects matching level).
    *   **Sub Mata Pelajaran Selector** (Filters sub-subjects matching subject).

### 3. Word Importer UI (`/guru/tryout/[id]/soal`)
*   Add a **"Import dari Word"** action button to the Question Builder interface.
*   Opens a dialog modal allowing file uploads, links a downloadable template `template-tryout.docx`, and runs a validation preview displaying extracted questions. Clicking "Simpan Soal" sends the payload to the upload endpoint.
