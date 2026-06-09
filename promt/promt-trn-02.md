# 🤖 AI Prompt: Execute Task TRN-02 - Level-Specific UI Themes and Dummy Users

Your task is to execute **Task TRN-02: Level-Specific UI Gradients and Dummy Users**. You will implement dynamic visual layouts in the student portal depending on their education level (SD, SMP, SMA) and provision level-scoped dummy accounts in the database seeder to verify this behavior.

---

## 🎯 Task Objectives

1.  **Differentiated Color Themes**:
    *   **SD (Elementary)**: Red gradient to white (`from-red-600 via-red-500 to-white`) with red highlights.
    *   **SMP (Junior High)**: Old Blue/Navy gradient to white (`from-blue-900 via-blue-800 to-white`) with deep navy highlights.
    *   **SMA (Senior High)**: Grey gradient to white (`from-slate-600 via-slate-500 to-white`) with slate-grey highlights.
2.  **User Seeding Expansion**:
    *   Provision dedicated guru (teacher) and siswa (student) accounts for each of the three levels in `scripts/seed.ts` with correct `kelas` formatting.

---

## 🏗️ Refactoring Blueprint

### 1. Level-Specific UI Styling (`frontend/src/app/(siswa)/siswa/layout.tsx` or components)
Read the student's profile information using `useProfile()` and check the `profile.kelas` string to resolve their education level:
```typescript
type Level = 'sd' | 'smp' | 'sma';

function getEducationLevel(kelas: string | null | undefined): Level {
  if (!kelas) return 'sma'; // Default fallback
  const k = kelas.toLowerCase();
  if (k.includes('sd') || /\b[1-6]\b/.test(k) || /\b(i|ii|iii|iv|v|vi)\b/.test(k)) {
    return 'sd';
  }
  if (k.includes('smp') || /\b[7-9]\b/.test(k) || /\b(vii|viii|ix)\b/.test(k)) {
    return 'smp';
  }
  return 'sma';
}
```

Based on the level, dynamically apply visual styles:

| Level | Background Gradient Classes | Button & Accent Colors | Hover / Focus Borders |
| :--- | :--- | :--- | :--- |
| **SD** | `bg-gradient-to-br from-red-600/10 via-red-50/50 to-white` | `bg-red-600 hover:bg-red-700 text-white` | `border-red-200 text-red-600` |
| **SMP** | `bg-gradient-to-br from-blue-900/10 via-blue-50/50 to-white` | `bg-blue-900 hover:bg-blue-950 text-white` | `border-blue-200 text-blue-900` |
| **SMA** | `bg-gradient-to-br from-slate-600/10 via-slate-50/50 to-white` | `bg-slate-600 hover:bg-slate-700 text-white` | `border-slate-200 text-slate-600` |

#### Styling Locations
Apply these dynamic gradients and accents to:
*   The main student dashboard background (`frontend/src/app/(siswa)/siswa/layout.tsx` or page body).
*   Welcome text headers and sidebar focus elements.
*   Action buttons (like `"Mulai Tryout"` and `"Kumpulkan"`).
*   Dashboard card background overlays and metric stat icon containers.

---

### 2. Add Dummy Users to Database Seeder (`scripts/seed.ts`)
Update the `users` array inside `scripts/seed.ts` to register dedicated teacher and student accounts for each of the three levels:

```typescript
const users = [
  // Existing administrators ...
  { email: 'admin@triton.id', password: 'admin123', role: 'admin', nama: 'Administrator' },

  // SD Accounts
  { email: 'guru.sd@triton.id', password: 'guru123', role: 'guru', nama: 'Ibu Sastro (SD)' },
  { email: 'siswa.sd@triton.id', password: 'siswa123', role: 'siswa', nama: 'Budi Kecil (SD)', kelas: '6 SD' },

  // SMP Accounts
  { email: 'guru.smp@triton.id', password: 'guru123', role: 'guru', nama: 'Bapak Hartono (SMP)' },
  { email: 'siswa.smp@triton.id', password: 'siswa123', role: 'siswa', nama: 'Rian Pratama (SMP)', kelas: '9 SMP' },

  // SMA Accounts
  { email: 'guru.sma@triton.id', password: 'guru123', role: 'guru', nama: 'Ibu Lestari (SMA)' },
  { email: 'siswa.sma@triton.id', password: 'siswa123', role: 'siswa', nama: 'Siti Rahma (SMA)', kelas: '12 SMA' }
]
```

Ensure the seeder maps the appropriate level-specific tryouts to their corresponding teacher ID (e.g. `guru.sd@triton.id` authors the `sd` tryout, `guru.smp@triton.id` authors the `smp` tryout, and `guru.sma@triton.id` authors the `sma` tryout).

---

## 🔍 Verification & Acceptance Criteria

1.  **Run migrations and seed the database**:
    ```bash
    make db-init
    make seed
    ```
2.  **Verify Authentication & Redirections**:
    *   Logging in as `siswa.sd@triton.id` redirects to the dashboard featuring the **Red-to-White** gradient UI.
    *   Logging in as `siswa.smp@triton.id` redirects to the dashboard featuring the **Old Blue-to-White** gradient UI.
    *   Logging in as `siswa.sma@triton.id` redirects to the dashboard featuring the **Grey-to-White** gradient UI.
3.  **Confirm Exam Content Partitioning**:
    *   The SD student should only see tryouts seeded in the SD category (`Tryout Matematika SD Kelas 6`).
    *   The SMP student should only see tryouts in the SMP category (`Tryout IPA SMP Kelas 9`).
    *   The SMA student should only see tryouts in the SMA category (`Tryout Fisika SMA Kelas 12`).
