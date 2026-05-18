# BUG TRACKER & FIX LIST — Triton Denpasar
# Identified from PDF screenshots and user feedback. Fix in priority order.

---

## PRIORITY 1 — CRITICAL BUGS (breaks functionality)

### BUG-001: Admin — Guru and Siswa users are mixed together
**Status:** BROKEN
**Observed:** Manage Siswa page shows all users (guru + siswa + admin) in one list
**Expected:** 
  - /admin/users?role=guru → shows ONLY users with role='guru'
  - /admin/users?role=siswa → shows ONLY users with role='siswa'
  - Separate sidebar nav items: "Kelola Guru" and "Kelola Siswa"
**Fix:**
  Backend: ensure GET /users?role=guru filter is applied on server
  Frontend: pass role query param from sidebar nav item, filter in API call
  Admin sidebar must have TWO SEPARATE nav items (not one combined)

### BUG-002: Siswa cannot answer questions
**Status:** BROKEN — exam page not functional
**Observed:** No functional exam page exists
**Expected:** Full exam flow (start → answer → submit → results)
**Fix:** Build complete exam flow per APP_FLOW.md FLOW 3

### BUG-003: Guru cannot delete tryout
**Status:** MISSING FEATURE
**Observed:** No delete option on tryout cards
**Expected:** "⋯" dropdown menu on each tryout card with:
  - "Kelola Soal" → /guru/tryout/{id}/soal
  - "Edit Tryout" → opens edit dialog
  - "Hapus Tryout" → confirmation dialog → DELETE /tryouts/{id}
**Fix:**
  Add MoreHorizontal (⋯) button to each tryout card
  Dropdown: shadcn DropdownMenu component
  Delete: AlertDialog confirmation, then DELETE /tryouts/{id}
  Backend: DELETE endpoint must cascade delete all soal + opsi + jawaban

### BUG-004: Guru cannot update tryout details
**Status:** MISSING FEATURE
**Observed:** No edit option for tryout metadata
**Expected:** Edit dialog for: nama_tryout, mata_pelajaran, durasi_menit
**Fix:** Add "Edit" option to ⋯ dropdown, opens shadcn Dialog with form

---

## PRIORITY 2 — UI/UX BUGS (broken layout)

### BUG-005: Layout not responsive — Admin dashboard
**Status:** BROKEN on mobile/tablet
**Observed:** Stats cards overflow, sidebar overlaps content on small screens
**Fix:**
  Stats: grid-cols-1 (mobile) md:grid-cols-3 (desktop)
  Sidebar: hidden on < lg, hamburger menu on mobile
  Table: overflow-x-auto wrapper on mobile
  All padding: px-4 md:px-6 lg:px-8

### BUG-006: Layout not responsive — Guru dashboard
**Status:** BROKEN on mobile/tablet
**Observed:** Tryout cards overflow, sidebar overlaps
**Fix:**
  Tryout grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  Sidebar: same as BUG-005
  Question builder: on mobile, sidebar becomes bottom drawer

### BUG-007: Layout not responsive — Siswa dashboard
**Status:** BROKEN on mobile/tablet
**Fix:**
  Stats: grid-cols-2 (mobile) lg:grid-cols-4 (desktop)
  Tryout cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  Sidebar: same mobile treatment

### BUG-008: Login page — visually unappealing
**Status:** NEEDS REDESIGN
**Observed:** Simple form with no branding, boring layout
**Expected:** Split layout (dark left panel + clean white right panel)
  Left: logo + "Platform Tryout Terpercaya" + bullet points
  Right: form with email, password, show/hide, submit
**Fix:** Complete rebuild per PROMPT_BUGS.md Part 2

### BUG-009: Landing page — too minimal for client demo
**Status:** NEEDS REDESIGN
**Observed:** Only hero section exists, no stats, no features, no testimonials
**Expected:** Full marketing page with 7+ sections
**Fix:** Complete rebuild per PROMPT_BUGS.md Part 1

### BUG-010: Question builder UX is confusing
**Status:** POOR UX
**Observed:** Simple textarea, no question type selection, no option management
**Expected:** Full CBT-grade question editor with:
  - Type selector (PG / Essay)
  - Rich text toolbar
  - Options A-E management with correct answer selection
  - Equation input (LaTeX)
  - Image upload
  - AI Generator
**Fix:** Complete rebuild per PROMPT_BUGS.md Part 4

---

## PRIORITY 3 — MISSING FEATURES

### FEAT-001: AI Soal Builder
**Status:** NOT BUILT
**Description:** 
  Guru can generate questions automatically using static JSON presets (demo mode)
  Opens via "Generate dengan AI" button in question builder
  Subjects: Matematika, Fisika, Biologi
  Quantities: 1 soal or 5 soal
  Questions are editable before saving
**Implementation:** See docs/AI_SOAL_PRESETS.md

### FEAT-002: Guru Profile Page
**Status:** NOT BUILT
**Required fields:** avatar, nama, telepon, mata_pelajaran (tags), bio
**Required actions:** change avatar, change password

### FEAT-003: Siswa Profile Page  
**Status:** NOT BUILT
**Required fields:** avatar, nama, telepon, kelas (select), bio
**Required actions:** change avatar, change password

### FEAT-004: Tryout Results Page
**Status:** NOT BUILT
**Required:** nilai, grade badge, per-question breakdown, correct answer shown

### FEAT-005: Siswa History Page
**Status:** NOT BUILT
**Required:** table of all completed tryouts with nilai, tanggal

### FEAT-006: Guru can see student results recap
**Status:** NOT BUILT
**Required:** for each tryout, guru sees table of siswa + their nilai
