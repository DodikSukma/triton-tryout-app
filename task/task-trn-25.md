# Task TRN-25: Anti-Cheat & Secure Exam Environment

## Overview
This task fortifies the integrity of the Try Out platform by implementing client-side and server-side anti-cheat mechanisms. The goal is to simulate a strict, secure testing environment that prevents unauthorized actions during an active exam session.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(siswa)/ujian/[id]/page.tsx` (Exam Engine Component)
- `frontend/src/hooks/useAntiCheat.ts` (New custom hook)

### Backend Services
- `services/auth-service/controllers/AuthController.go` (Session management)

## ⚙️ Detailed Specifications

### 1. Client-Side Browser Restrictions (Hooks)
Create a `useAntiCheat` hook that activates when the exam starts:
- **Disable Right-Click:** Prevent the context menu (`onContextMenu={(e) => e.preventDefault()}`).
- **Disable Keyboard Shortcuts:** Intercept and block shortcuts like `Ctrl+C`, `Ctrl+V`, `Ctrl+P`, and `F12` (Developer Tools).
- **Fullscreen Enforcement:** Prompt the user to enter Fullscreen Mode via the HTML5 Fullscreen API before the exam can begin. If the user exits fullscreen, automatically pause the exam and throw a warning modal.

### 2. Visibility & Tab Switching Detection
- Utilize the `document.visibilityState` API.
- If the student switches tabs or minimizes the browser, log a "Strike".
- After 3 strikes, the exam is automatically submitted and terminated, and the status is flagged as `violated`.

### 3. Concurrent Login Prevention
- Modify the authentication logic. If User A logs into Device 2 while a session for User A is already active on Device 1, the token for Device 1 must be immediately invalidated.
- The exam engine must routinely verify token validity. If invalidated, boot the user out of the exam.

## ⚡ Verification Plan
1. **Shortcut & Right-Click Test:** Start an exam. Attempt to right-click text. Attempt to copy (Ctrl+C). Verify all actions are blocked.
2. **Fullscreen Test:** Start an exam. Press `ESC` to exit fullscreen. Verify a warning modal blocks the screen until fullscreen is restored.
3. **Strike Test:** Switch tabs 3 times. Verify the exam terminates automatically on the 3rd attempt.
