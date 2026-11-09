#!/usr/bin/env bash
# 커버/챕터 v4 시각 하네스 — 로컬 전용 (앱 라우트·EAS 빌드와 무관).
#
#   cd expo-app && bash scripts/cover-chapter-visual-harness/run.sh
#
# 1) esbuild · playwright-core 를 사용자 캐시에 고정 버전으로 설치 (package.json 변경 없음)
# 2) entry.tsx → react-native-web 번들 (build.js)
# 3) 시스템 Chrome 으로 화면별 캡처 + DOM 판정 → $COVER_HARNESS_ARTIFACTS_DIR (기본 /opt/cursor/artifacts)
#
# 환경 변수: COVER_HARNESS_TOOLS_DIR · COVER_HARNESS_OUT_DIR · COVER_HARNESS_ARTIFACTS_DIR · COVER_HARNESS_CHROME
set -euo pipefail

ESBUILD_VERSION="0.28.2"
PLAYWRIGHT_CORE_VERSION="1.65.0"

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="${COVER_HARNESS_TOOLS_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/mindgarden-cover-harness}"

tool_version() {
  node -e "try{console.log(require('$TOOLS_DIR/node_modules/$1/package.json').version)}catch(e){}"
}

if [[ "$(tool_version esbuild)" != "$ESBUILD_VERSION" || "$(tool_version playwright-core)" != "$PLAYWRIGHT_CORE_VERSION" ]]; then
  echo "[cover-harness] installing esbuild@$ESBUILD_VERSION playwright-core@$PLAYWRIGHT_CORE_VERSION → $TOOLS_DIR"
  mkdir -p "$TOOLS_DIR"
  [[ -f "$TOOLS_DIR/package.json" ]] || echo '{"name":"mindgarden-cover-harness-tools","private":true}' > "$TOOLS_DIR/package.json"
  npm install --prefix "$TOOLS_DIR" --no-audit --no-fund --silent \
    "esbuild@$ESBUILD_VERSION" "playwright-core@$PLAYWRIGHT_CORE_VERSION"
fi

export COVER_HARNESS_TOOLS_DIR="$TOOLS_DIR"
node "$HARNESS_DIR/build.js"
node "$HARNESS_DIR/capture.js"
