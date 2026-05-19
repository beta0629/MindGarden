#!/usr/bin/env bash
#
# dev API가 EAS iOS 빌드에 박히도록 env를 export한 뒤 internal-dev 프로필로 클라우드 빌드한다.
# (Android build-android-apk-dev.sh 와 동일한 dev API·EAS projectId 정책)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export EXPO_USE_DEV_CLIENT=0
export EXPO_PUBLIC_API_BASE_URL=https://dev.core-solution.co.kr
export APP_ENV=development

if [[ -n "${EAS_PROJECT_ID:-}" ]]; then
  export EXPO_PUBLIC_EAS_PROJECT_ID="${EXPO_PUBLIC_EAS_PROJECT_ID:-$EAS_PROJECT_ID}"
fi
if [[ -n "${EXPO_PUBLIC_EAS_PROJECT_ID:-}" ]]; then
  export EAS_PROJECT_ID="${EAS_PROJECT_ID:-$EXPO_PUBLIC_EAS_PROJECT_ID}"
fi

if ! command -v eas >/dev/null 2>&1 && ! npx --yes eas-cli --version >/dev/null 2>&1; then
  echo "❌ EAS CLI가 없습니다. 설치: npm install -g eas-cli  또는  npx eas-cli login"
  exit 1
fi

run_eas() {
  if command -v eas >/dev/null 2>&1; then
    eas "$@"
  else
    npx --yes eas-cli "$@"
  fi
}

echo "======================================"
echo "  MindGarden iOS EAS (internal-dev)"
echo "  EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}"
if [[ -n "${EAS_PROJECT_ID:-}" ]]; then
  echo "  EAS_PROJECT_ID=(set)"
else
  echo "  EAS_PROJECT_ID=(unset — Expo push token may fail on device)"
fi
echo "  profile=internal-dev  platform=ios  simulator=false"
echo "======================================"
echo ""
echo "사전: expo.dev → Credentials → iOS → Push Key (APNs .p8)"
echo "검증: 실기기/TestFlight — 시뮬레이터는 ExponentPushToken 불안정"
echo ""

run_eas build --profile internal-dev --platform ios --non-interactive
