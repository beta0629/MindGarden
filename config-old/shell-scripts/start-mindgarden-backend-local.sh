#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"

cd "$ROOT_DIR"

if [[ -f "scripts/load-env.sh" ]]; then
  # shellcheck disable=SC1091
  source "scripts/load-env.sh"
fi

if command -v lsof >/dev/null 2>&1; then
  if PID_ON_PORT="$(lsof -ti tcp:8080 || true)"; then
    if [[ -n "$PID_ON_PORT" ]]; then
      kill -9 "$PID_ON_PORT" 2>/dev/null || true
      sleep 1
    fi
  fi
fi

mvn spring-boot:run -Dspring-boot.run.profiles=local



