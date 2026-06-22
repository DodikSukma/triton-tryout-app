# 🤖 AI Task: Execute Documentation Complete Task - Triton Docs Portal

Your task is to build a modern, high-contrast, interactive, and comprehensive Documentation Portal inside the **`docs/index.html`** file of the Triton project. This portal will replace the legacy overview redirect and compile all project specifications, operational guides, debugging/maintenance sheets, and deployment manuals into a single premium interface.

---

## 🎯 Design & UI Requirements

*   **Premium Tech Aesthetics**: Use a responsive, dark-mode-first sidebar layout (e.g. Slate/Neutral color palettes with vivid Blue/Indigo interactive triggers) powered by Tailwind CSS via CDN.
*   **Zero Placeholders**: Write full, complete, and accurate explanations. Do not write filler copy or draft text.
*   **Client-Side Navigation**: Use clean, lightweight JavaScript to toggle sidebar links dynamically without page refreshes, keeping the URL clean.
*   **Readability Utilities**: Add code blocks with clear syntax styling and hover-to-copy buttons. Use high-contrast font combinations (e.g., *Inter* or *Fira Code* via Google Fonts).

---

## 📂 Required Documentation Structure

The documentation portal must include the following distinct sections:

### 1. 🎓 System Overview & Key Features
*   **Role Matrix**: Explain the Admin, Guru (Teacher), and Siswa (Student) access structures, dashboard routes, and capabilities.
*   **Education Level Isolation (TRN-01 & TRN-02)**: Explain the deconstructed modular microservices layout (`sd-service`, `smp-service`, `sma-service`) running on separate ports and databases.
*   **MS Word Upload (.docx) (TRN-03)**: Document the parser formatting rules (using `[SOAL]` blocks, `Tipe`, `Bobot`, correct option keys prefixed with an asterisk `*`, and KaTeX/LaTeX syntax wrapped in `$$`).
*   **Security & Proctoring (TRN-04 & TRN-07)**: Document the exam shuffling engine (Fisher-Yates randomizations saved deterministic to the session) and proctoring locks (fullscreen tracking, window focus blur detection, and copy-paste disables).
*   **Audit Logging (TRN-06)**: Document the database seeder footprints, microservice POST sync triggers, and the Superuser logs dashboard interface.

### 2. 🏗️ Microservices Architecture & Data Flow
*   Provide a clean ASCII diagram or Mermaid workflow chart illustrating request paths from the Next.js Frontend ➔ API Gateway (Port 4000) ➔ Level-Specific Service Routers (Ports 4005, 4006, 4007) and Shared Auth/User Databases.
*   Detail the session resolution handshake: cookies parsing via the Gateway, forwarding verification queries internally to `auth-service` (Port 4001), and injecting request headers (`x-user-id`, `x-user-role`, `x-user-class`).

### 3. 🔧 Maintenance & Troubleshooting Guide
Include concrete instructions on maintaining the platform health:
*   **Tailing and Cleaning Logs**: Document how to run `make logs`, inspect errors with `make logs-error`, and clear log dumps using `make logs-clean`.
*   **Service Restarts**: Show how to restart the docker engine, stop microservices via `make stop`, and spin up the developer hot-reload environment with `make dev`.
*   **Port Conflicts**: Explain how to use command commands (such as `lsof -i :4000` and `kill -9`) to clear processes lockups when starting servers.
*   **TypeScript / Build Auditing**: Document dependency installations using `make install` and production build compilations using `make build`.

### 4. 🚀 Cloud Deployment Manual (Supabase + Vercel + Microservices Hosting)
Provide clear instructions on taking the Triton platform live in production:

#### A. Centralized Database Provisioning (Supabase)
1.  **Database Creations**: Instruct the user on creating projects inside Supabase and setting up distinct databases (`db_auth`, `db_user`, `db_sd`, `db_smp`, `db_sma`).
2.  **Schema Executions**: Explain how to run database schemas by copy-pasting the migration SQL files (`src/db/schema.sql` files for each service) directly into the Supabase SQL editor.
3.  **Connection Strings**: Show how to extract transaction/session connection URLs from Supabase database settings and map them into the `.env` production file.

#### B. Frontend Deployment (Vercel)
1.  **Importing Project**: Direct the user on linking the repository root folder to Vercel and configuring the build path to the `frontend` subfolder.
2.  **Configuring Variables**: Declare the required build parameters inside the Vercel Settings panel:
    *   `NEXT_PUBLIC_API_URL`: Point this to the domain URL of the deployed API Gateway service.
3.  **Build Command**: Set the custom build script: `npm run build` with Output Directory set to `.next`.

#### C. Backend Microservices Deployment (Render / Railway / VPS)
1.  **Setting up Containers/Services**: Detail how to deploy the six Express backend services (Gateway, Auth, User, SD, SMP, SMA) as independent web services using Docker configurations or Node runtimes.
2.  **Injecting Production `.env` parameters**:
    *   Configure database endpoints pointing to the corresponding Supabase connection string URLs.
    *   Configure Redis variables to point to a managed cloud Redis provider (e.g. Upstash, Redis Labs, or Railway Redis Add-on).
    *   Assign production service URL environments to route communication between the gateway proxy and level microservices.
3.  **Health Check Verification**: Instruct the user on calling `/health` endpoints to verify service connection logs.
