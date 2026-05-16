#!/usr/bin/env bash
#
# MindGarden Expo 앱 — 터미널에서 Metro + (선택) Android/iOS 실행
#
# 사용 (expo-app 디렉터리에서):
#   ./scripts/dev-app.sh
#   ./scripts/dev-app.sh --clean --android
#   ./scripts/dev-app.sh --port 8084 --android
#   npm run dev
#   npm run dev:android
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

METRO_PORT="${METRO_PORT:-8081}"
CLEAN=false
KILL_STALE=false
OPEN_ANDROID=false
OPEN_IOS=false
USE_LAN=true
SKIP_ADB=false
SKIP_VERIFY=false

usage() {
  cat <<'EOF'
MindGarden Expo — dev-app.sh

옵션:
  -c, --clean          Metro 캐시 삭제 후 시작 (expo start --clear)
  -k, --kill-stale     시작 전 Metro 포트(기본 8081) 점유 프로세스 종료
  -a, --android        Metro 기동 후 Android Dev Client 실행
  -i, --ios            Metro 기동 후 iOS 시뮬레이터 실행
  -p, --port <n>       Metro 포트 (기본 8081). 실기기: adb reverse도 동일 포트
  --localhost          --lan 대신 localhost (시뮬레이터 위주)
  --no-adb             adb reverse 생략
  --no-verify          verify:metro-mmkv 생략 (긴급 시만)
  -h, --help           이 도움말

환경 변수:
  METRO_PORT, EXPO_PUBLIC_API_BASE_URL (선택, .env는 Expo가 자동 로드)

예:
  npm run dev
  npm run dev:android
  METRO_PORT=8084 ./scripts/dev-app.sh --clean -k -a
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -c | --clean) CLEAN=true ;;
    -k | --kill-stale) KILL_STALE=true ;;
    -a | --android) OPEN_ANDROID=true ;;
    -i | --ios) OPEN_IOS=true ;;
    -p | --port)
      METRO_PORT="${2:?포트 번호 필요}"
      shift
      ;;
    --localhost) USE_LAN=false ;;
    --no-adb) SKIP_ADB=true ;;
    --no-verify) SKIP_VERIFY=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "알 수 없는 옵션: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

export RCT_METRO_PORT="$METRO_PORT"
export EXPO_METRO_PORT="$METRO_PORT"

echo ""
echo "======================================"
echo "  MindGarden Expo Dev"
echo "======================================"
echo "  경로: $ROOT_DIR"
echo "  Metro 포트: $METRO_PORT"
echo ""

if [[ -f "$ROOT_DIR/.env" ]]; then
  echo "  .env 로드됨 (Expo가 번들 시 EXPO_PUBLIC_* 반영)"
else
  echo "  참고: .env 없음 — expo-app/.env.example 참고"
fi
echo ""

free_metro_port() {
  local port="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  local pids
  pids="$(lsof -ti:"$port" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo "⚠️  포트 ${port} 사용 중 — Node/Metro 프로세스 종료"
  # shellcheck disable=SC2086
  kill -9 $pids 2>/dev/null || true
  sleep 1
}

if [[ "$KILL_STALE" == true ]] || [[ "$CLEAN" == true ]]; then
  free_metro_port "$METRO_PORT"
fi

if [[ "$SKIP_VERIFY" != true ]]; then
  echo "🔍 Metro/MMKV 검증 (verify:metro-mmkv)..."
  npm run verify:metro-mmkv
  echo ""
fi

if [[ "$SKIP_ADB" != true ]] && command -v adb >/dev/null 2>&1; then
  device_count="$(adb devices 2>/dev/null | grep -E '[[:space:]]device$' | wc -l | tr -d ' ')"
  if [[ "${device_count:-0}" -gt 0 ]]; then
    echo "📱 adb reverse tcp:${METRO_PORT} (연결 기기 ${device_count}대)..."
    METRO_PORT="$METRO_PORT" node ./scripts/adb-reverse-metro-port.js
    echo ""
  else
    echo "ℹ️  adb 기기 없음 — reverse 생략 (에뮬레이터/실기기 연결 후 재실행하거나 npm run adb:reverse-metro)"
    echo ""
  fi
elif [[ "$SKIP_ADB" != true ]]; then
  echo "ℹ️  adb 없음 — Android 실기기는 Wi-Fi LAN URL 또는 시뮬레이터만 사용"
  echo ""
fi

EXPO_ARGS=(start)
if [[ "$USE_LAN" == true ]]; then
  EXPO_ARGS+=(--lan)
else
  EXPO_ARGS+=(--localhost)
fi
if [[ "$CLEAN" == true ]]; then
  EXPO_ARGS+=(--clear)
fi
if [[ "$OPEN_ANDROID" == true ]]; then
  EXPO_ARGS+=(--android)
fi
if [[ "$OPEN_IOS" == true ]]; then
  EXPO_ARGS+=(--ios)
fi

echo "🚀 Metro 시작: node ./scripts/run-expo.js ${EXPO_ARGS[*]}"
echo ""
echo "  실기기(Dev Client): QR 또는 터미널 URL로 접속 (앱 아이콘만 누르면 크래시 날 수 있음)"
echo "  Android 실기기: 포트가 ${METRO_PORT}이면 반드시 adb reverse 일치"
echo "  로그인·API: https://dev.core-solution.co.kr — 변경 시 .env / eas.json 확인"
echo ""

exec node ./scripts/run-expo.js "${EXPO_ARGS[@]}"
