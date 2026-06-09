# 🎓 Triton Denpasar — Features Overview

Triton Denpasar is a professional, high-performance Online Tryout Platform designed to streamline the examination lifecycle for academic centers. Built on a modular microservices architecture, the application divides operations into dedicated microservices (Authentication, Profile Management, Question Management, and Assessment Processing) integrated through a unified API Gateway.

This directory serves as the documentation index for Triton's features. All documentation is written in English for clarity and clean formatting.

---

## 👥 Roles & Access Overview

The platform supports three primary user roles, each with its dedicated dashboard, access level, and navigation.

| Role | Key Responsibilities | Primary Dashboard | Specific Docs |
| :--- | :--- | :--- | :--- |
| **Admin** | Oversees user accounts (Teachers & Students) and monitors platform activity | `/admin/dashboard` | [Admin Features (admin.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/admin.md) |
| **Guru (Teacher)** | Authors exams (tryouts), manages question repositories, and reviews results | `/guru/dashboard` | [Guru Features (guru.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/guru.md) |
| **Siswa (Student)** | Registers for tests, takes exams in CBT mode, and reviews historical performance | `/siswa/dashboard` | [Siswa Features (siswa.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/siswa.md) |

---

## 📂 Feature Documentation Index

Explore detailed technical and functional specifications for each system capability:

### 1. 🔐 [Multi-Role Authentication & Access Control (auth.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/auth.md)
*   Token/Session based login with Express.js security middlewares.
*   Centralized session management powered by a Redis caching store.
*   Next.js 14 Middleware protection blocking unauthorized cross-role routing.

### 2. 🛡️ [Admin Dashboard & User Management (admin.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/admin.md)
*   Separate database models and lists for Teachers (`guru`) and Students (`siswa`).
*   Form-driven credential generation and subject/class assignment.
*   Real-time session and platform-wide statistics tracking.

### 3. 📝 [Guru Dashboard & Tryout Management (guru.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/guru.md)
*   Tryout creation, update, deletion (fully cascading database entities).
*   Test states lifecycle transitions (`draft` ➔ `published` ➔ `closed`).
*   Direct class-grade performance recap dashboards.

### 4. 🗄️ [Question Builder & AI Question Generator (bank-soal.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/bank-soal.md)
*   Rich text & HTML editor supporting both Multiple-Choice (PG) and Essay questions.
*   Formatting tool utilizing KaTeX/LaTeX for mathematical formulas.
*   AI-powered mock generator allowing instant generation of questions for Mathematics, Physics, and Biology.

### 5. ✍️ [Siswa Portal & Exam Engine (siswa.md)](file:///Users/indriregita/Desktop/ATALA%20PROJECT/Project/tritonapp/fitur/siswa.md)
*   Distraction-free, full-screen CBT (Computer Based Test) exam interface.
*   Progress-tracking sidebar navigation and flagging system.
*   Real-time auto-saving answer system and server-syncing timer.
*   Performance grading reports showing correct/wrong answer breakdowns.
