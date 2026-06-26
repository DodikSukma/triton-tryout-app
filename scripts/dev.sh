#!/usr/bin/env bash
# Runs all services in development mode with ts-node-dev (hot reload).
# Each service opens in a new terminal tab on macOS, or runs sequentially with & on Linux.
set -e

if [ -n "$SCRIPT_DIR" ]; then
  ROOT="$(dirname "$SCRIPT_DIR")"
else
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi
LOGS="$ROOT/logs"
PIDS="$ROOT/.pids"

rm -f "$PIDS"

# Load .env WITHOUT process substitution: macOS /bin/bash is 3.2, where
# `source <(...)` silently reads nothing → every var ends up empty. Read line by
# line instead, stripping Windows CRs, skipping comments/blanks. (set -a exports.)
set -a
while IFS= read -r _envline || [ -n "$_envline" ]; do
  _envline="${_envline%$'\r'}"                 # strip trailing CR (Windows .env)
  case "$_envline" in ''|'#'*) continue ;; esac
  export "$_envline"
done < "$ROOT/.env"
set +a

run_dev() {
  local NAME=$1
  local DIR=$2
  local DB=$3
  local PORT=$4

  echo "  Starting $NAME in dev mode (port $PORT)..."
  (
    cd "$DIR"
    POSTGRES_HOST="$POSTGRES_HOST" \
    POSTGRES_PORT="$POSTGRES_PORT" \
    POSTGRES_USER="$POSTGRES_USER" \
    POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    POSTGRES_DB="${POSTGRES_DB:-$DB}" \
    REDIS_HOST="$REDIS_HOST" \
    REDIS_PORT="$REDIS_PORT" \
    SESSION_SECRET="$SESSION_SECRET" \
    SESSION_MAX_AGE_MS="$SESSION_MAX_AGE_MS" \
    USER_SERVICE_URL="$USER_SERVICE_URL" \
    PORT="$PORT" \
    npx ts-node-dev --respawn --transpile-only src/index.ts \
      >> "$LOGS/$NAME.log" \
      2>> "$LOGS/$NAME-error.log" &
    echo $! >> "$PIDS"
  )
}

echo "🔧 Starting all Triton services in DEV mode (hot reload)..."

run_dev "auth-service" "$ROOT/services/auth-service" "db_auth" 4001
run_dev "user-service" "$ROOT/services/user-service" "db_user" 4002
run_dev "sd-service"   "$ROOT/services/sd-service"   "db_sd"   4005
run_dev "smp-service"  "$ROOT/services/smp-service"  "db_smp"  4006
run_dev "sma-service"  "$ROOT/services/sma-service"  "db_sma"  4007

echo "  Starting api-gateway in dev mode (port 4000)..."
(
  cd "$ROOT/services/api-gateway"
  AUTH_SERVICE_URL="$AUTH_SERVICE_URL" \
  USER_SERVICE_URL="$USER_SERVICE_URL" \
  SD_SERVICE_URL="$SD_SERVICE_URL" \
  SMP_SERVICE_URL="$SMP_SERVICE_URL" \
  SMA_SERVICE_URL="$SMA_SERVICE_URL" \
  FRONTEND_URL="$FRONTEND_URL" \
  PORT=4000 \
  npx ts-node-dev --respawn --transpile-only src/index.ts \
    >> "$LOGS/api-gateway.log" \
    2>> "$LOGS/api-gateway-error.log" &
  echo $! >> "$PIDS"
)

# ─── Web apps (TRN-24) ───────────────────────────────────────
# The core app (frontend, :3000) and the standalone marketing site
# (landingpage, :3001) boot alongside the services so `make dev` brings up the
# whole stack. The two apps are fully independent — no shared URLs.
echo "  Starting frontend in dev mode (port 3000)..."
(
  cd "$ROOT/frontend"
  NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  npm run dev \
    >> "$LOGS/frontend.log" 2>&1 &
  echo $! >> "$PIDS"
)

echo "  Starting landingpage in dev mode (port 3001)..."
(
  cd "$ROOT/landingpage"
  npm run dev \
    >> "$LOGS/landingpage.log" 2>&1 &
  echo $! >> "$PIDS"
)

sleep 3

echo ""
echo "✅ All services running in dev mode. PIDs saved to .pids"
echo "   • Core app:     http://localhost:3000"
echo "   • Landing page: http://localhost:3001"
echo "   • API gateway:  http://localhost:4000"
echo "   Run 'make logs' to tail logs or 'make health' to check status."
