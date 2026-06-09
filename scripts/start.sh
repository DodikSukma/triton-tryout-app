#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="$ROOT/logs"
PIDS="$ROOT/.pids"

mkdir -p "$LOGS"
rm -f "$PIDS"

source "$ROOT/.env"

start_service() {
  local NAME=$1
  local DIR=$2
  local DB=$3
  local PORT=$4

  echo "  Starting $NAME (port $PORT)..."
  (
    cd "$DIR"
    POSTGRES_HOST="$POSTGRES_HOST" \
    POSTGRES_PORT="$POSTGRES_PORT" \
    POSTGRES_USER="$POSTGRES_USER" \
    POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    POSTGRES_DB="$DB" \
    REDIS_HOST="$REDIS_HOST" \
    REDIS_PORT="$REDIS_PORT" \
    SESSION_SECRET="$SESSION_SECRET" \
    SESSION_MAX_AGE_MS="$SESSION_MAX_AGE_MS" \
    USER_SERVICE_URL="$USER_SERVICE_URL" \
    AUTH_SERVICE_URL="$AUTH_SERVICE_URL" \
    PORT="$PORT" \
    node dist/index.js \
      >> "$LOGS/$NAME.log" \
      2>> "$LOGS/$NAME-error.log" &
    echo $! >> "$PIDS"
  )
}

echo "🚀 Starting all Triton services..."

start_service "auth-service" "$ROOT/services/auth-service" "db_auth" 4001
start_service "user-service" "$ROOT/services/user-service" "db_user" 4002
start_service "sd-service"   "$ROOT/services/sd-service"   "db_sd"   4005
start_service "smp-service"  "$ROOT/services/smp-service"  "db_smp"  4006
start_service "sma-service"  "$ROOT/services/sma-service"  "db_sma"  4007

echo "  Starting api-gateway (port 4000)..."
(
  cd "$ROOT/services/api-gateway"
  AUTH_SERVICE_URL="$AUTH_SERVICE_URL" \
  USER_SERVICE_URL="$USER_SERVICE_URL" \
  SD_SERVICE_URL="$SD_SERVICE_URL" \
  SMP_SERVICE_URL="$SMP_SERVICE_URL" \
  SMA_SERVICE_URL="$SMA_SERVICE_URL" \
  FRONTEND_URL="$FRONTEND_URL" \
  PORT=4000 \
  node dist/index.js \
    >> "$LOGS/api-gateway.log" \
    2>> "$LOGS/api-gateway-error.log" &
  echo $! >> "$PIDS"
)

sleep 2

echo ""
echo "✅ All services started. PIDs saved to .pids"
echo "   Run 'make health' to verify or 'make logs' to tail logs."
