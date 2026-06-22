# Task TRN-13: Implement Offline-First Auto-Save and Background Synchronization for Student Exam Answers

## Overview
This task aims to implement an **offline-first local backup, auto-save, and background sync mechanism** inside the Student Exam Page (`frontend/src/app/(exam)/exam/[sesiId]/page.tsx`). 
During examinations, unstable network connections can cause data-saving requests to fail. To prevent answers from being lost:
1. Answers will be saved immediately to `localStorage` as a primary backup.
2. If online, the answers will be synced to the backend immediately.
3. If offline, the answers will remain cached locally with a `synced: false` flag.
4. A background sync mechanism will automatically upload pending cached answers to the server as soon as connection is restored.
5. A clean network status indicator (Online / Offline) will be displayed to give students confidence in their connection status.

---

## 📂 Target Files & Impact Areas

### 1. Frontend Client
- `frontend/src/app/(exam)/exam/[sesiId]/page.tsx` (Exam runner page UI and answer-saving logic)

---

## ⚙️ Detailed Specifications

### 1. Local Storage Schema & Synchronization State
- In the `ExamPage` component, declare a local backup key:
  ```typescript
  const backupKey = `triton-exam-backup-${sesiId}`
  ```
- The schema of the backup data in `localStorage` must track synchronization status:
  ```typescript
  type LocalAnswer = {
    opsi_id: string | null
    jawaban_teks: string | null
    synced: boolean
    timestamp: number
  }
  type ExamBackup = Record<string, LocalAnswer> // key is soalId
  ```

### 2. Synchronization & Auto-save Logic

#### A. Initial Load & Recovery Merge
When loading the exam page (`useEffect` on mount):
1. Fetch session details and answers from the backend `/sesi/${sesiId}` (already implemented).
2. Load any existing local backups from `localStorage`.
3. **Merge Logic**:
   - If a question has an answer in the local backup that is marked `synced: false` and is newer than or missing from the backend response, populate the state with the local answer.
   - If the backend answer is newer or the local answer is already synced, use the backend answer.
   - Sync the combined answers back to the React `answers` state.

#### B. Update `saveAnswer` Implementation
Refactor `saveAnswer` to handle connection losses gracefully:
1. **Immediate Local Save**: Write the selected option or essay text to `localStorage` immediately with `synced: false` and the current timestamp.
2. **Network Check & Post**:
   - Check if `navigator.onLine` is true. If false, set the saving indicator to `saved` (saved locally) and skip the fetch post.
   - If online, attempt to post the answer to `/sesi/${sesiId}/jawab`.
   - On **Success**: Update the `localStorage` entry for that question to `synced: true`.
   - On **Failure** (Network error/Timeout): Keep `synced: false` in `localStorage`. Show a silent saving status or a small retry badge without throwing disruptive popups to the student.

#### C. Background Sync Mechanism
- Implement a background loop (using `setInterval` every 5-10 seconds) or listen to the window `online` event.
- When the window triggers the `online` event or the loop runs while `navigator.onLine` is true:
  1. Retrieve all questions in `localStorage` marked `synced: false`.
  2. Send them to the backend service sequentially.
  3. Mark them as `synced: true` in `localStorage` upon successful API response.

---

### 3. User Interface (UI) Updates

#### A. Network Status Banner
- Monitor network status in a React state `isOnline` using window event listeners:
  ```typescript
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  ```
- Render a persistent status indicator/badge next to the timer in the header:
  - **Online**: A subtle indicator (e.g. `● Terkoneksi` in green).
  - **Offline**: A prominent warning banner/badge (e.g. `⚠️ Offline (Tersimpan Lokal)` in yellow/red background) to notify the student that their connection is unstable but their answers are safely backed up locally.

#### B. Submission Guard
- In `doSubmit` (before completing the tryout):
  - Check if there are any answers in `localStorage` with `synced: false`.
  - If there are unsynced answers, block the submission and display a loading modal: `"Menyinkronkan sisa jawaban ke server, mohon tunggu..."`.
  - Attempt to sync all remaining questions. If successful, proceed with submission.
  - If the sync fails after multiple retries, show an error alert: `"Koneksi gagal. Periksa internet Anda untuk mengumpulkan jawaban."` with a manual "Coba Lagi" button.

---

## ⚡ Verification Plan
1. **Offline Mode Test**:
   - Start the tryout, then disconnect the internet (using Chrome DevTools Network tab -> toggle "Offline").
   - Click option answers or write essay answers.
   - Verify that the network status banner switches to `⚠️ Offline (Tersimpan Lokal)` and that answers are written to `localStorage` with `synced: false`.
   - Refresh the page while still offline, and verify that the local answers are successfully restored from `localStorage`.
2. **Auto-Reconnect Sync Test**:
   - Toggle Chrome DevTools back to "Online".
   - Verify that the background sync triggers automatically and uploads all pending answers to the backend.
   - Check the console logs and verify that the database holds the correct answers.
3. **Guard Submission Test**:
   - While offline, try to submit the tryout. Verify that the submission is blocked and a sync-in-progress indicator is shown.
