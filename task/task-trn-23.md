# Task TRN-23: Local Database Cleanup Utility

## Overview
This task aims to create a secure utility to clean up all local transaction and master data while preserving core user authentication records. This is extremely useful for local development and QA testing where the database often gets cluttered with test Try Outs, Bank Soal, and exam attempts.
The utility will truncate all tables across the microservices **except** the `users` (and related authentication) tables.

## 📂 Target Files & Impact Areas

### Scripts / Backend Utilities
- `scripts/clean_local_db.sh` or `scripts/clean_local_db.sql`
- `Makefile` (To add a shortcut command)

## ⚙️ Detailed Specifications

### 1. Identify Target Tables for Deletion
- Identify all transaction and content tables across `sd-service`, `smp-service`, and `sma-service` (e.g., `tryouts`, `questions`, `answers`, `exam_sessions`, `student_scores`, `bank_soals`).
- Explicitly identify tables that must **NOT** be deleted (e.g., `users`, `roles`, `permissions`, `migrations` or any table managing core credentials).

### 2. Implementation Approach
- Create a SQL script or a shell script that connects to the local PostgreSQL database (running on port `5432`).
- Execute `TRUNCATE TABLE [table_name] CASCADE;` for all the identified target tables.
- **Critical Safety Guard:** Ensure this script contains a strict environment check. It must **ONLY** execute if `APP_ENV=local` or `APP_ENV=development`. If it detects a production or staging environment, it must immediately abort to prevent catastrophic data loss.

### 3. Integration with Makefile
- Add a new command in the root `Makefile` to make it easily accessible for developers and agents:
  ```makefile
  .PHONY: db-clean
  db-clean:
  	@echo "🧹 Cleaning local database (Preserving Users)..."
  	@bash ./scripts/clean_local_db.sh
  	@echo "✅ Database cleaned successfully!"
  ```

## ⚡ Verification Plan
1. **Safety Check:** Attempt to run the cleanup script with an environment variable simulating production (`APP_ENV=production`). Verify that the script refuses to run and outputs an error.
2. **Execution:** Ensure the local environment is running. Execute `make db-clean`.
3. **Data Verification:** 
   - Inspect the PostgreSQL database. The `users` table must still contain all registered teachers, students, and admins.
   - The tables for `questions`, `tryouts`, and `exam_sessions` must be completely empty (0 rows).
4. **App Verification:** Log in to the application as a teacher or admin. You should be able to log in successfully (proving the users table is intact), but the dashboard should show zero tryouts and zero questions.
