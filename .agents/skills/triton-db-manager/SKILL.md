---
name: "triton_db_manager"
description: "Synchronizes, initializes, and seeds PostgreSQL databases across multiple levels (SD, SMP, SMA, Auth, User)"
---

# Triton Database Manager Skill

This skill governs the management of the multi-database PostgreSQL setup (`db_auth`, `db_user`, `db_sd`, `db_smp`, `db_sma`) inside the Docker containers.

## Agent Workflow Instructions:

1. **Schema Integrity**:
   * When modifying schemas (e.g., adding columns, altering tables), ensure the change is applied to all level-specific schemas:
     * `services/sd-service/src/db/schema.sql`
     * `services/smp-service/src/db/schema.sql`
     * `services/sma-service/src/db/schema.sql`
   * Keep the definitions consistent across all three services.

2. **Automated Sync & Initialization**:
   * After any change to `schema.sql` or `scripts/seed.ts` files:
     * Execute `make db-init` to apply SQL schemas. This command is safe and idempotent (`CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
     * If you updated the database seeder, execute `make seed` to apply updated seed records.
   * If any errors occur, review the logs or run `make health` to check service status.

3. **Collaborative Sync Logging**:
   * To prevent teammates from missing database syncs when they `git pull` your changes:
     * Create or append a short note in `docs/db-migrations-log.md` detailing the new tables or columns introduced (e.g., `[2026-06-26] Added column 'batal' (boolean) to tryouts table`).
     * Recommend running `make db-init` in the completion summary to alert the user.
