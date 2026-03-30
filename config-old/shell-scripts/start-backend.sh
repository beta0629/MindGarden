#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
BACK_DIR="$ROOT_DIR/backend-ops"
ENV_FILE="$BACK_DIR/.env.local"
PORT=7080

cleanup() {
  if [[ -n "${BACK_PID:-}" ]]; then
    echo "Stopping backend (PID $BACK_PID)..."
    kill "$BACK_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if [[ ! -x "$BACK_DIR/gradlew" ]]; then
  echo "Generating Gradle wrapper..."
  (cd "$BACK_DIR" && gradle wrapper)
fi

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$BACK_DIR/env.local.example" ]]; then
    echo "Creating backend-ops/.env.local from env.local.example (개발 기본값 사용)."
    cp "$BACK_DIR/env.local.example" "$ENV_FILE"
  else
    cat <<'EOF' > "$ENV_FILE"
OPS_ADMIN_USERNAME=ops-admin
OPS_ADMIN_PASSWORD=change-me
OPS_ADMIN_ROLE=HQ_ADMIN

SECURITY_JWT_SECRET=local-dev-secret-change-me-please-use-a-stronger-one
SECURITY_JWT_ISSUER=mindgarden-ops-local
SECURITY_JWT_EXPIRES=3600
EOF
    echo "Created backend-ops/.env.local with fallback defaults."
  fi
fi

echo "Loading environment variables from $ENV_FILE"
while IFS='=' read -r key value; do
  key="$(echo "$key" | xargs)"
  if [[ -z "$key" || "$key" == \#* ]]; then
    continue
  fi
  value="${value:-}"
  value="${value%\"}"
  value="${value#\"}"
  export "$key=$value"
done < "$ENV_FILE"

if command -v lsof >/dev/null 2>&1; then
  PID_ON_PORT="$(lsof -ti tcp:$PORT || true)"
  if [[ -n "$PID_ON_PORT" ]]; then
    echo "Port $PORT is in use by PID $PID_ON_PORT. Stopping it."
    kill -9 "$PID_ON_PORT" 2>/dev/null || true
    sleep 1
  fi
fi

echo "Starting backend on port $PORT (profile=local)..."
(cd "$BACK_DIR" && ./gradlew bootRun --args="--spring.profiles.active=local") &
BACK_PID=$!
wait $BACK_PID

