#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
FRONT_DIR="$ROOT_DIR/frontend-ops"
BACK_DIR="$ROOT_DIR/backend-ops"

BACK_PROFILE="local"

cleanup() {
  if [[ -n "${BACK_PID:-}" ]]; then
    echo "Stopping backend (PID $BACK_PID)..."
    kill "$BACK_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONT_PID:-}" ]]; then
    echo "Stopping frontend (PID $FRONT_PID)..."
    kill "$FRONT_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if [[ ! -x "$BACK_DIR/gradlew" ]]; then
  echo "Generating Gradle wrapper..."
  (cd "$BACK_DIR" && gradle wrapper)
fi

if [[ ! -f "$FRONT_DIR/.env.local" ]]; then
  if [[ -f "$FRONT_DIR/env.local.example" ]]; then
    echo "Creating frontend-ops/.env.local from env.local.example (개발용 기본값)."
    cp "$FRONT_DIR/env.local.example" "$FRONT_DIR/.env.local"
  else
    cat <<'EOF' > "$FRONT_DIR/.env.local"
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:7080/api/v1
NEXT_PUBLIC_OPS_API_USE_MOCK=true
EOF
    echo "Created frontend-ops/.env.local with fallback defaults."
  fi
fi

export NEXT_PUBLIC_OPS_API_BASE_URL=${NEXT_PUBLIC_OPS_API_BASE_URL:-$(grep NEXT_PUBLIC_OPS_API_BASE_URL "$FRONT_DIR/.env.local" | tail -n1 | cut -d'=' -f2-)}
export NEXT_PUBLIC_OPS_API_USE_MOCK=${NEXT_PUBLIC_OPS_API_USE_MOCK:-$(grep NEXT_PUBLIC_OPS_API_USE_MOCK "$FRONT_DIR/.env.local" | tail -n1 | cut -d'=' -f2-)}

echo "Starting backend (profile=$BACK_PROFILE, port=7080)..."
(cd "$BACK_DIR" && ./gradlew bootRun --args="--spring.profiles.active=$BACK_PROFILE") &
BACK_PID=$!

sleep 3

echo "Starting frontend (port=4300)..."
(cd "$FRONT_DIR" && npm install >/dev/null 2>&1 && npm run dev:ops) &
FRONT_PID=$!

echo "Backend PID: $BACK_PID"
echo "Frontend PID: $FRONT_PID"
echo "Frontend available at http://localhost:4300"
echo "Press Ctrl+C to stop both services."

wait
