#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
BACK_DIR="$ROOT_DIR"
FRONT_DIR="$ROOT_DIR/frontend"

BACK_PROFILE="local"
BACK_PORT=8080
FRONT_PORT=3000

cleanup() {
  if [[ -n "${BACK_PID:-}" ]]; then
    echo "[mindgarden] Stopping backend (PID $BACK_PID)..."
    kill "$BACK_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONT_PID:-}" ]]; then
    echo "[mindgarden] Stopping frontend (PID $FRONT_PID)..."
    kill "$FRONT_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "[mindgarden] Project root: $ROOT_DIR"

# Load local env if exists
if [[ -f "$ROOT_DIR/.env.local" ]]; then
  echo "[mindgarden] Loading environment from .env.local"
  # shellcheck disable=SC2046
  export $(grep -v '^\s*#' "$ROOT_DIR/.env.local" | xargs -0 || true)
else
  echo "[mindgarden] WARNING: .env.local not found. Using default config files only."
fi

# Ensure backend port is free
if command -v lsof >/dev/null 2>&1; then
  if PID_ON_PORT="$(lsof -ti tcp:$BACK_PORT || true)"; then
    if [[ -n "$PID_ON_PORT" ]]; then
      echo "[mindgarden] Port $BACK_PORT in use by PID $PID_ON_PORT, killing..."
      kill -9 "$PID_ON_PORT" 2>/dev/null || true
      sleep 1
    fi
  fi
fi

echo "[mindgarden] Starting backend (profile=$BACK_PROFILE, port=$BACK_PORT)..."
(cd "$BACK_DIR" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=$BACK_PROFILE) &
BACK_PID=$!

sleep 5

if [[ -d "$FRONT_DIR" ]]; then
  if [[ ! -f "$FRONT_DIR/.env.local" && -f "$FRONT_DIR/.env.local.example" ]]; then
    echo "[mindgarden] Creating frontend/.env.local from .env.local.example"
    cp "$FRONT_DIR/.env.local.example" "$FRONT_DIR/.env.local"
  fi

  # Ensure frontend port is free
  if command v lsof >/dev/null 2>&1; then
    if PID_ON_FRONT="$(lsof -ti tcp:$FRONT_PORT || true)"; then
      if [[ -n "$PID_ON_FRONT" ]]; then
        echo "[mindgarden] Port $FRONT_PORT in use by PID $PID_ON_FRONT, killing..."
        kill -9 "$PID_ON_FRONT" 2>/dev/null || true
        sleep 1
      fi
    fi
  fi

  echo "[mindgarden] Starting frontend (port=$FRONT_PORT)..."
  (cd "$FRONT_DIR" && npm install && npm start) &
  FRONT_PID=$!
else
  echo "[mindgarden] WARNING: frontend directory '$FRONT_DIR' not found. Backend only started."
fi

echo "[mindgarden] Backend PID : $BACK_PID"
echo "[mindgarden] Frontend PID: ${FRONT_PID:-N/A}"
echo "[mindgarden] MindGarden is available at http://localhost:$FRONT_PORT"
echo "[mindgarden] Press Ctrl+C to stop both."

wait



