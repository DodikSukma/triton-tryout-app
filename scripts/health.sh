#!/usr/bin/env bash
echo "🏥 Triton Health Check"
echo "────────────────────────────────────"

check() {
  local NAME=$1
  local URL=$2
  local RESPONSE
  RESPONSE=$(curl -sf "$URL" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "  ✅  $NAME"
  else
    echo "  ❌  $NAME  →  $URL not responding"
  fi
}

check "auth-service (4001)" "http://localhost:4001/health"
check "user-service (4002)" "http://localhost:4002/health"
check "sd-service   (4005)" "http://localhost:4005/health"
check "smp-service  (4006)" "http://localhost:4006/health"
check "sma-service  (4007)" "http://localhost:4007/health"
check "api-gateway  (4000)" "http://localhost:4000/health"

echo "────────────────────────────────────"

# Redis check
if redis-cli ping > /dev/null 2>&1; then
  echo "  ✅  Redis (6379)"
else
  echo "  ❌  Redis (6379) not responding"
fi

# PostgreSQL check
if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo "  ✅  PostgreSQL (5432)"
else
  echo "  ❌  PostgreSQL (5432) not responding"
fi

echo "────────────────────────────────────"
