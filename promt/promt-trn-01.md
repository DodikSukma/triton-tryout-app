# 🤖 AI Prompt: Execute Task TRN-01 - 3 Education Level Microservices

Your task is to execute **Task TRN-01: Setup Arsitektur 3 Microservices (SD, SMP, SMA)**. You will refactor the platform's core services to separate examination and testing data by educational level (Elementary, Junior High, Senior High), improving modularity, scalability, and risk isolation.

---

## 🎯 Task Objective

Deconstruct the generic, monolithic `soal-service` (Port 4003) and `jawaban-service` (Port 4004) into three independent education-level microservices:
1.  **SD Service (`sd-service`)**: Port **4005**, Database **`db_sd`** (For Elementary level tryouts, questions, sessions, and answers).
2.  **SMP Service (`smp-service`)**: Port **4006**, Database **`db_smp`** (For Junior High level tryouts, questions, sessions, and answers).
3.  **SMA Service (`sma-service`)**: Port **4007**, Database **`db_sma`** (For Senior High level tryouts, questions, sessions, and answers).

Each of these three new services will handle both question management (`soal`) and exam administration/scoring (`jawaban`) for its level. The original `soal-service` and `jawaban-service` will be deprecated and removed.

---

## 🏗️ Refactoring Blueprint

```mermaid
graph TD
    subgraph Clients [Client Layer]
        FE[Next.js Frontend]
    end

    subgraph Router [API Gateway (Port 4000)]
        GW[Gateway Routing Proxy]
    end

    subgraph Core [Shared Microservices]
        AU[auth-service: Port 4001 / db_auth]
        US[user-service: Port 4002 / db_user]
    end

    subgraph LevelServices [Level Microservices]
        SD[sd-service: Port 4005 / db_sd]
        SMP[smp-service: Port 4006 / db_smp]
        SMA[sma-service: Port 4007 / db_sma]
    end

    FE -->|API requests| GW
    GW -->|/auth/*| AU
    GW -->|/users/*| US
    GW -->|/sd/*| SD
    GW -->|/smp/*| SMP
    GW -->|/sma/*| SMA
```

---

## 📋 Execution Steps

Follow these sequential steps to complete the architectural setup:

### Step 1: Database Migration Setup
Combine the SQL schemas of the old `soal-service` and `jawaban-service` into a unified schema for the three new databases (`db_sd`, `db_smp`, `db_sma`).
Create a schema script at `services/sd-service/src/db/schema.sql` (and duplicate for `smp-service` and `sma-service`) containing:
*   `tryouts`
*   `soal`
*   `opsi_jawaban`
*   `sesi_tryout`
*   `jawaban`
*   `hasil`

### Step 2: Implement Level-Specific Services
Create the folders `services/sd-service`, `services/smp-service`, and `services/sma-service`.
*   Migrate the combined routes and controllers from `soal-service` and `jawaban-service`.
*   Ensure that when grading a session (`/sesi/:sesiId/selesai`), the service queries questions from its local database rather than making cross-service REST calls.
*   Configure the database connection pools in each service to target `db_sd`, `db_smp`, and `db_sma` respectively.

### Step 3: Update API Gateway Proxy Rules
Modify `services/api-gateway/src/index.ts`:
*   Add environment variables for level service URLs:
    ```typescript
    const SD_SERVICE_URL  = process.env.SD_SERVICE_URL  ?? 'http://localhost:4005';
    const SMP_SERVICE_URL = process.env.SMP_SERVICE_URL ?? 'http://localhost:4006';
    const SMA_SERVICE_URL = process.env.SMA_SERVICE_URL ?? 'http://localhost:4007';
    ```
*   Implement router proxies to intercept prefix requests:
    *   `app.use('/sd', requireAuth, createProxyMiddleware({ target: SD_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/sd': '' } }))`
    *   `app.use('/smp', requireAuth, createProxyMiddleware({ target: SMP_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/smp': '' } }))`
    *   `app.use('/sma', requireAuth, createProxyMiddleware({ target: SMA_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/sma': '' } }))`
*   Apply the appropriate route role guards (e.g. ensuring teachers and students only interact with level routes permitted by their profiles).

### Step 4: Update Infrastructure Configuration
*   **`.env`**: Add service URL hostnames and databases.
*   **`docker-compose.yml`**:
    *   Define three databases: `db_sd`, `db_smp`, and `db_sma`.
    *   Declare service containers for `sd-service`, `smp-service`, and `sma-service` on ports 4005, 4006, and 4007.
    *   Remove configurations for `soal-service` and `jawaban-service`.
*   **`Makefile`**:
    *   Update `install`, `build`, `dev`, `stop`, `db-init`, and `clean` commands to run for the three new services.
    *   Expose level-specific database setups:
        ```bash
        docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_sd;"
        docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_smp;"
        docker exec -it triton-postgres psql -U triton_user -c "CREATE DATABASE db_sma;"
        ```

### Step 5: Update Seed & Frontend Request Logic
*   **Seeder (`scripts/seed.ts`)**: Adjust the script to populate initial tryout questions and answers across the three level-specific databases based on subject and school level targets.
*   **Frontend Request Layer (`frontend/src/lib/api.ts` or page files)**: Update page actions to route API requests with prefix paths (`/sd`, `/smp`, or `/sma`) resolving target URLs dynamically based on active page route contexts.

---

## 🔍 Verification & Acceptance Criteria

To declare the task successful, verify that:
1.  Running `make dev` starts all services successfully.
2.  Running `make health` indicates healthy statuses for:
    *   `api-gateway`
    *   `auth-service`
    *   `user-service`
    *   `sd-service` (Port 4005)
    *   `smp-service` (Port 4006)
    *   `sma-service` (Port 4007)
3.  Drafting questions, answering tryouts, and calculating grades works independently on each service without cross-talk or data leakage.
