#!/usr/bin/env bash
#
# TRN-23: Local Database Cleanup Utility
# ──────────────────────────────────────────────────────────────────────────────
# Truncates ALL transaction + content + master data across the level services
# (db_sd / db_smp / db_sma) and the user service (master data + audit logs),
# while PRESERVING user records:
#     KEEP  → db_auth.users          (login credentials)
#     KEEP  → db_user.profiles       (user identity: name, kelas, mata pelajaran)
#     WIPE  → db_sd/smp/sma: tryouts, soal, opsi_jawaban, sesi_tryout, jawaban, hasil
#     WIPE  → db_user: audit_logs, master_kelas, master_mata_pelajaran,
#                       master_sub_mata_pelajaran
#
# SAFETY: only runs when APP_ENV is local/development, and refuses any database
# host that looks remote/managed. Designed for local dev & QA resets ONLY.
#
# Usage:  bash scripts/clean_local_db.sh      (or:  make db-clean)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Read a key from the environment, falling back to .env, then a default ──────
read_env() {
  local key="$1" default="${2:-}" val=""
  val="$(printenv "$key" 2>/dev/null || true)"
  if [ -z "$val" ] && [ -f "$ROOT_DIR/.env" ]; then
    val="$(grep -E "^[[:space:]]*${key}=" "$ROOT_DIR/.env" | tail -n1 | cut -d= -f2- \
           | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//')"
  fi
  echo "${val:-$default}"
}

APP_ENV="$(read_env APP_ENV local)"
PGHOST="$(read_env POSTGRES_HOST localhost)"
PGPORT="$(read_env POSTGRES_PORT 5432)"
PGUSER="$(read_env POSTGRES_USER triton_user)"
PGPASSWORD="$(read_env POSTGRES_PASSWORD triton_secret_2024)"
SHARED_DB="$(read_env POSTGRES_DB '')"
export PGPASSWORD

# ── Safety guard 1: environment must be local/development ─────────────────────
case "$(printf '%s' "$APP_ENV" | tr '[:upper:]' '[:lower:]')" in
  local|localhost|development|dev|test) ;;
  *)
    echo "❌ ABORT: APP_ENV='${APP_ENV}' is not a local/development environment."
    echo "   This destructive cleanup only runs when APP_ENV is local or development."
    exit 1 ;;
esac

# ── Safety guard 2: never touch an obviously remote / managed database ─────────
case "$PGHOST" in
  localhost|127.0.0.1|::1|0.0.0.0) ;;
  *)
    if printf '%s' "$PGHOST" | grep -qiE 'supabase|rds|amazonaws|azure|gcp|googleapis|render|neon|heroku|\.com|\.net|\.io|\.dev|\.org'; then
      echo "❌ ABORT: refusing to clean a non-local database host: ${PGHOST}"
      exit 1
    fi
    echo "⚠️  Database host '${PGHOST}' is not localhost — proceeding because APP_ENV=${APP_ENV}." ;;
esac

# ── SQL: tables to wipe (CASCADE handles FK references) ───────────────────────
LEVEL_SQL="TRUNCATE TABLE hasil, jawaban, sesi_tryout, opsi_jawaban, soal, tryouts CASCADE;"
USER_SQL="TRUNCATE TABLE audit_logs, master_sub_mata_pelajaran, master_mata_pelajaran, master_kelas CASCADE;"

run_db() {     # $1 = database, $2 = sql, $3 = label
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$1" -c "$2" >/dev/null
  echo "   ✅ $3"
}
run_schema() { # $1 = schema, $2 = sql, $3 = label  (shared-DB / Supabase mode)
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$SHARED_DB" \
       -c "SET search_path TO $1; $2" >/dev/null
  echo "   ✅ $3"
}

echo "🧹 Cleaning local database (preserving users & profiles)..."
echo "   Host: ${PGHOST}:${PGPORT}   User: ${PGUSER}   APP_ENV: ${APP_ENV}"

if [ -n "$SHARED_DB" ]; then
  echo "   Mode: shared database '${SHARED_DB}' (multi-schema)"
  run_schema sd       "$LEVEL_SQL" "schema sd cleared"
  run_schema smp      "$LEVEL_SQL" "schema smp cleared"
  run_schema sma      "$LEVEL_SQL" "schema sma cleared"
  run_schema user_svc "$USER_SQL"  "schema user_svc cleared (master data + audit logs)"
else
  echo "   Mode: separate databases (local)"
  run_db db_sd   "$LEVEL_SQL" "db_sd cleared"
  run_db db_smp  "$LEVEL_SQL" "db_smp cleared"
  run_db db_sma  "$LEVEL_SQL" "db_sma cleared"
  run_db db_user "$USER_SQL"  "db_user cleared (master data + audit logs) — profiles preserved"
fi

echo "✅ Cleanup complete. Preserved: db_auth.users, db_user.profiles"
