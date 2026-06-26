#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS="$ROOT/.pids"

# Backend services + web apps (frontend 3000, landingpage 3001).
PORTS="4000 4001 4002 4005 4006 4007 3000 3001"

echo "🛑 Stopping all Triton services..."

if [ -f "$PIDS" ]; then
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && echo "  Stopped PID $pid"
    fi
  done < "$PIDS"
  rm -f "$PIDS"
fi

# Always sweep known ports — npm-spawned Next children outlive their parent PID.
for port in $PORTS; do
  pid=$(lsof -ti ":$port" 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null && echo "  Killed process on port $port (PID $pid)"
  fi
done

echo "✅ All services stopped."
