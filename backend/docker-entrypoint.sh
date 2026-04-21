#!/bin/sh
set -e

# Optional seed on startup: ensures roles exist for register/login flow.
if [ "${AUTO_SEED:-true}" = "true" ]; then
  echo "[backend] Running seed_roles.py..."
  python seed_roles.py
fi

echo "[backend] Starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
