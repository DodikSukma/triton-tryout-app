# Task TRN-22: AKM Question Types & Image Options

## Overview
This task aims to enrich the question types that can be created by Teachers (Bank Soal) and Admin Soal (Super Try Out) to align with the National Assessment (AKM) standards, and to add media support for answer options:
1. **New Question Types:** Support the creation of *Complex Multiple Choice* (Pilihan Ganda Kompleks), *Matching* (Menjodohkan), and *Short Answer* (Isian Singkat) question types, complementing the existing Multiple Choice and Essay types.
2. **Image Answer Options:** Allow question creators (Teachers/Admin Soal) to paste images directly into the answer option input fields (Option A, B, C, D, etc.).
3. **Option Image Compression:** Ensure the existing image compression helper in the frontend works properly when creators paste images into the options, preventing the payload from becoming too large.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(guru)/guru/bank-soal/create/page.tsx` (Teacher question creation form)
- `frontend/src/app/(admin-soal)/admin-soal/super-tryout/create/page.tsx` (Admin Soal question creation form)
- `frontend/src/utils/imageHelper.ts` (Or related utility handling Base64/File compression)
- UI input/answer option components need to be modified to accept the `onPaste` event and render an `<img>` tag if the type is an image.

### Backend Services
- `services/api/models/Question.go` (Add new question type enums/constants: `PGK`, `MATCHING`, `SHORT_ANSWER`. Modify the `options` schema to store image payloads).
- `services/api/models/Answer.go` (Adjust correct answer validation schema for PGK, Matching, and Short Answer types).

## ⚙️ Detailed Specifications

### 1. New Question Types (AKM)
- **Question Type Dropdown:** In the question creation UI, change the question type dropdown to 5 types: Multiple Choice (Pilihan Ganda), Complex Multiple Choice (Pilihan Ganda Kompleks), Matching (Menjodohkan), Short Answer (Isian Singkat), and Essay (Esai).
- **UI Dynamics:**
  - *Complex Multiple Choice:* UI similar to Multiple Choice, but uses *checkboxes* for the `kunci_jawaban` (correct answer), allowing more than one selection.
  - *Matching:* UI consisting of 2 columns (Left Column & Right Column) to create pairs.
  - *Short Answer:* A single text input UI to define the correct answer *keyword*.

### 2. Image Paste Feature on Answer Options
- **`onPaste` Event:** Add an `onPaste` event listener to the answer option input/textarea.
- **Render Image:** If the clipboard contains an image file (`image/png`, `image/jpeg`), change the input display to a small image *preview* accompanied by a remove/cross button ("Remove Image").
- **Data Payload:** The option data must be able to distinguish whether the option is text or an image (e.g., `is_image: true`).

### 3. Image Compression Helper Integration
- **Paste Interception:** When an image is successfully pasted, execute the existing client-side compression *helper* function before rendering the *preview* or saving it to the *state*.
- **Optimization:** The compression function should resize dimensions and reduce *quality* so that the resulting Base64 *string* or File Blob is very lightweight (ideally < 100KB per answer option).
- **Error Handling:** Provide an error notification/toast if the image fails to compress or if the format is unsupported.

## ⚡ Verification Plan
1. **Create New Question:** Log in as Teacher/Admin Soal. Navigate to the Create Question page. Ensure the question type dropdown contains all 5 options.
2. **Test Image Paste:** Select the Multiple Choice type. Copy an image and paste (Ctrl+V) directly inside the Option A input. Verify the image immediately appears as a *preview* within that option.
3. **Test Compression:** Open Developer Tools (Network/Console). Verify that the size of the image data saved to the *state* is significantly smaller than the original file size due to the compression function.
4. **Save and Display (Student View):** Save the question, then check it in the Student exam mode. Verify that Option A is rendered as an `<img>` element instead of text.
