#!/usr/bin/env bash
#
# dev API가 릴리스 JS 번들에 박히도록 env를 prebuild·Gradle 번들 단계까지 유지한다.
# (npm 한 줄에서 `VAR=val cmd1 && cmd2` 는 VAR이 cmd2에 전달되지 않음)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export EXPO_USE_DEV_CLIENT=0
export EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr
export EXPO_PUBLIC_ADMIN_SESSION_DIAG=1
export APP_ENV=development

# EAS projectId — env 가 있을 때만 prebuild·app.config 에 전달 (없으면 app.config 폴백)
if [[ -n "${EAS_PROJECT_ID:-}" ]]; then
  export EXPO_PUBLIC_EAS_PROJECT_ID="${EXPO_PUBLIC_EAS_PROJECT_ID:-$EAS_PROJECT_ID}"
fi
if [[ -n "${EXPO_PUBLIC_EAS_PROJECT_ID:-}" ]]; then
  export EAS_PROJECT_ID="${EAS_PROJECT_ID:-$EXPO_PUBLIC_EAS_PROJECT_ID}"
fi

echo "======================================"
echo "  MindGarden Android APK (DEV API)"
echo "  EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}"
if [[ -n "${EAS_PROJECT_ID:-}" ]]; then
  echo "  EAS_PROJECT_ID=(set)"
else
  echo "  EAS_PROJECT_ID=(unset — Expo push token may fail on device)"
fi
echo "======================================"
echo ""

npx expo prebuild --platform android --clean

cd android
./gradlew clean assembleRelease

APK_OUT="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "✅ APK: android/app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK_OUT" ]]; then
  echo "   embedded apiBaseUrl:"
  unzip -p "$APK_OUT" assets/app.config 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ', d.get('extra',{}).get('apiBaseUrl','(missing)'))" \
    || echo "   (app.config 파싱 실패)"
fi
