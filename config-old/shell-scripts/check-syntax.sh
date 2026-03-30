#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
BACK_DIR="$ROOT_DIR/backend-ops"
FRONT_DIR="$ROOT_DIR/frontend-ops"

if [[ ! -x "$BACK_DIR/gradlew" ]]; then
  echo "Gradle wrapper가 없어 생성합니다."
  (cd "$BACK_DIR" && gradle wrapper)
fi

echo "[1/2] backend-ops: ./gradlew check"
(cd "$BACK_DIR" && ./gradlew check)

echo "[2/2] frontend-ops: npm run lint"
(cd "$FRONT_DIR" && npm install >/dev/null 2>&1 && npm run lint)

echo "✅ Syntax/lint 검사 완료"
