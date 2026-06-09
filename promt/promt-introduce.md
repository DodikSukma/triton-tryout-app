# 🤖 AI Prompt: Project Onboarding & Understanding

You are an expert AI software engineer. Your task is to onboard yourself into the **Triton Denpasar Tryout Platform** project, analyze its architecture, directory structure, databases, and operational mechanisms, and verify that you have a comprehensive understanding of the codebase.

---

## 📂 Project Architecture Overview

The Triton Denpasar platform is built on a modern full-stack architecture:
*   **Frontend**: Next.js 14 (App Router) styled with TailwindCSS and powered by lucide-react icons and shadcn UI components.
*   **Backend Gateway**: An API Gateway (`api-gateway`) serving as a reverse proxy, checking session status, enforcing role guards, and forwarding clean requests to specific microservices.
*   **Backend Services**: Node.js & Express.js microservices (currently split into `auth-service`, `user-service`, `soal-service`, and `jawaban-service`).
*   **Databases**: PostgreSQL for relational records (using multiple distinct databases: `db_auth`, `db_user`, `db_soal`, and `db_jawaban`), and Redis for centralized cookie sessions (`triton.sid`).

---

## 🗂️ Workspace Layout Reference

Familiarize yourself with the core folders of the repository:
```
tritonapp/
├── frontend/                   # Next.js 14 App Router UI (port 3000)
├── services/
│   ├── api-gateway/            # Reverse proxy, CORS, session verification (port 4000)
│   ├── auth-service/           # User authentication, password hashes, Redis sessions (port 4001)
│   ├── user-service/           # Admin user management & user profiles (port 4002)
│   ├── soal-service/           # Tryout metadata & question builder repository (port 4003)
│   └── jawaban-service/        # Exam session runner, answer tracker, scoring engines (port 4004)
├── fitur/                      # Complete feature documentation (in English)
│   ├── fitur.md                # System index mapping
│   ├── auth.md                 # Role-based access control details
│   ├── admin.md                # Admin dashboard & profile configurations
│   ├── guru.md                 # Teacher tryout publishing lifecycles
│   ├── bank-soal.md            # Question builder & AI generator modals
│   └── siswa.md                # CBT exam screen & performance metrics
├── docs/                       # Legacy Indonesian docs and flow guides
├── scripts/                    # Dev runner (dev.sh) and seeders
├── Makefile                    # System commands (install, dev, build, stop)
├── docker-compose.yml          # PostgreSQL & Redis container declarations
└── .env                        # Local environment variables configuration
```

---

## 🚀 Step-by-Step Inspection Checklist

Before reporting your understanding, complete the following analysis:
1.  **Analyze Database Schemas**: Inspect the SQL migration schemas inside `services/*/src/db/schema.sql` to understand the data models and relations.
2.  **Review the Gateway Router**: Inspect `services/api-gateway/src/index.ts` to see how routing and role permissions are mapped onto backend service endpoints.
3.  **Read the Feature Documentation**: Read all files in the `fitur/` directory to understand how the user journeys (Admin, Guru, Siswa) are structured.
4.  **Examine the Dev Runner & Environment**: Review the root `Makefile`, `docker-compose.yml`, `.env`, and `scripts/dev.sh` to understand how the services are initialized and run.

---

## 💬 Expected Response

After completing the inspection, output a clear summary detailing:
*   A summary of your findings (confirming database roles, ports, and microservices links).
*   A brief confirmation statement in English indicating that you are fully onboarded and ready for your first task.
