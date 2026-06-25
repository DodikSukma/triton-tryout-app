SHELL := /bin/bash
.PHONY: install build start run dev stop restart health logs logs-error logs-clean \
        seed db-create db-init db-clear db-clean clean frontend

# ─────────────────────────────────────────────────────────────
#  INSTALL
# ─────────────────────────────────────────────────────────────
install:
	@echo "📦 Installing all dependencies..."
	@for dir in services/auth-service services/user-service services/sd-service \
	            services/smp-service services/sma-service services/api-gateway; do \
		echo "   → $$dir"; \
		(cd $$dir && npm install --silent); \
	done
	@echo "   → frontend"
	@(cd frontend && npm install --silent)
	@echo "   → scripts"
	@(cd scripts && npm install --silent)
	@echo "✅ Done"

# ─────────────────────────────────────────────────────────────
#  BUILD
# ─────────────────────────────────────────────────────────────
build:
	@echo "🔨 Building all services..."
	@for dir in services/auth-service services/user-service services/sd-service \
	            services/smp-service services/sma-service services/api-gateway; do \
		echo "   → $$dir"; \
		(cd $$dir && npm run build --silent); \
	done
	@echo "✅ Build complete"

# ─────────────────────────────────────────────────────────────
#  START  (production — runs built dist/)
# ─────────────────────────────────────────────────────────────
start run: build
	@bash scripts/start.sh

# ─────────────────────────────────────────────────────────────
#  DEV  (hot-reload with ts-node-dev)
# ─────────────────────────────────────────────────────────────
dev:
	@bash scripts/dev.sh

# ─────────────────────────────────────────────────────────────
#  STOP
# ─────────────────────────────────────────────────────────────
stop:
	@bash scripts/stop.sh

# ─────────────────────────────────────────────────────────────
#  RESTART
# ─────────────────────────────────────────────────────────────
restart: stop start

# ─────────────────────────────────────────────────────────────
#  HEALTH CHECK
# ─────────────────────────────────────────────────────────────
health:
	@bash scripts/health.sh

# ─────────────────────────────────────────────────────────────
#  LOGS
# ─────────────────────────────────────────────────────────────
logs:
	@echo "📋 Tailing all logs (Ctrl+C to stop)..."
	@tail -f logs/*.log 2>/dev/null || echo "No log files found. Run 'make start' or 'make dev' first."

logs-error:
	@echo "🚨 Tailing error logs only (Ctrl+C to stop)..."
	@tail -f logs/*-error.log 2>/dev/null || echo "No error log files found."

logs-auth:
	@tail -f logs/auth-service.log logs/auth-service-error.log

logs-gateway:
	@tail -f logs/api-gateway.log logs/api-gateway-error.log

logs-clean:
	@echo "🧹 Clearing log files..."
	@rm -f logs/*.log
	@echo "✅ Logs cleared"

# ─────────────────────────────────────────────────────────────
#  DATABASE
# ─────────────────────────────────────────────────────────────
db-create:
	@echo "🗄️  Creating databases (idempotent)..."
	@docker exec triton-postgres psql -U triton_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='db_auth'"  | grep -q 1 || docker exec triton-postgres psql -U triton_user -d postgres -c "CREATE DATABASE db_auth;"
	@docker exec triton-postgres psql -U triton_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='db_user'"  | grep -q 1 || docker exec triton-postgres psql -U triton_user -d postgres -c "CREATE DATABASE db_user;"
	@docker exec triton-postgres psql -U triton_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='db_sd'"    | grep -q 1 || docker exec triton-postgres psql -U triton_user -d postgres -c "CREATE DATABASE db_sd;"
	@docker exec triton-postgres psql -U triton_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='db_smp'"   | grep -q 1 || docker exec triton-postgres psql -U triton_user -d postgres -c "CREATE DATABASE db_smp;"
	@docker exec triton-postgres psql -U triton_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='db_sma'"   | grep -q 1 || docker exec triton-postgres psql -U triton_user -d postgres -c "CREATE DATABASE db_sma;"
	@echo "✅ Databases ready (db_auth, db_user, db_sd, db_smp, db_sma)"

db-init:
	@echo "⚡ Initializing all database schemas..."
	@(cd scripts && npx ts-node db-init.ts)

seed:
	@echo "🌱 Seeding database..."
	@(cd scripts && npx ts-node seed.ts)

db-clear:
	@echo "🧹 Clearing active tryout records..."
	@(cd scripts && npx ts-node db-clear.ts)

db-clean:
	@echo "🧹 Cleaning local database (Preserving Users)..."
	@bash ./scripts/clean_local_db.sh
	@echo "✅ Database cleaned successfully!"


# ─────────────────────────────────────────────────────────────
#  FRONTEND
# ─────────────────────────────────────────────────────────────
frontend:
	@echo "🖥️  Starting frontend dev server..."
	@(cd frontend && npm run dev)

# ─────────────────────────────────────────────────────────────
#  CLEAN
# ─────────────────────────────────────────────────────────────
clean:
	@echo "🧹 Removing dist/ folders..."
	@for dir in services/auth-service services/user-service services/sd-service \
	            services/smp-service services/sma-service services/api-gateway; do \
		rm -rf $$dir/dist; \
	done
	@echo "✅ Clean done"

# ─────────────────────────────────────────────────────────────
#  HELP
# ─────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Triton Denpasar — Available Commands"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make install       Install all npm dependencies"
	@echo "  make build         Compile TypeScript for all services"
	@echo "  make start / run   Build + start all services (production)"
	@echo "  make dev           Start all services with hot-reload (dev)"
	@echo "  make stop          Stop all running services"
	@echo "  make restart       Stop then start again"
	@echo "  make health        Check all service health endpoints"
	@echo "  make logs          Tail all log files"
	@echo "  make logs-error    Tail error logs only"
	@echo "  make logs-auth     Tail auth-service logs only"
	@echo "  make logs-gateway  Tail api-gateway logs only"
	@echo "  make logs-clean    Delete all log files"
	@echo "  make db-create     Create databases (db_auth/user/sd/smp/sma) in Docker"
	@echo "  make db-init       Apply SQL schemas to all databases"
	@echo "  make db-clear      Clear tryout records only (db_sd/smp/sma)"
	@echo "  make db-clean      Wipe all data except users/profiles (local only)"
	@echo "  make seed          Seed users + per-level tryouts (SD/SMP/SMA)"
	@echo "  make frontend      Start Next.js dev server"
	@echo "  make clean         Remove all dist/ build artifacts"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo ""
