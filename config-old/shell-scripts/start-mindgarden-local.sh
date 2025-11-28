#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
BACK_SCRIPT="$ROOT_DIR/config/shell-scripts/start-mindgarden-backend-local.sh"
FRONT_DIR="$ROOT_DIR/frontend"

cd "$ROOT_DIR"

# 백엔드 실행 (백그라운드)
if [[ -x "$BACK_SCRIPT" ]]; then
  "$BACK_SCRIPT" &
  BACK_PID=$!
else
  echo "[mindgarden] 백엔드 스크립트를 찾을 수 없습니다: $BACK_SCRIPT"
  exit 1
fi

sleep 5

# 프론트엔드 실행
if [[ -d "$FRONT_DIR" ]]; then
  cd "$FRONT_DIR"
  npm install
  npm start
else
  echo "[mindgarden] 프론트엔드 디렉토리를 찾을 수 없습니다: $FRONT_DIR"
fi



