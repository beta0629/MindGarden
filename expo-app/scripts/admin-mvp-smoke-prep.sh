#!/usr/bin/env bash
#
# Admin 모바일 MVP — 수동 스모크 준비 (기기·APK·logcat·체크리스트)
# 비밀/계정 정보 없음. docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md 참고.
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PACKAGE="com.mindgardenmobile"
MAIN_ACTIVITY="${PACKAGE}/.MainActivity"
APK_CANDIDATES=(
  "$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
  "$ROOT_DIR/mindgarden-dev-release.apk"
)
STAMP_FILE="$ROOT_DIR/.cache/admin-mvp-smoke-apk-install-mtime"
LOG_WAIT_SEC="${LOG_WAIT_SEC:-5}"
FORCE_INSTALL=false
SKIP_INSTALL=false

usage() {
  cat <<'EOF'
Admin MVP 수동 스모크 준비

사용 (expo-app 디렉터리 또는 저장소 루트):
  ./scripts/admin-mvp-smoke-prep.sh
  ./scripts/admin-mvp-smoke-prep.sh --force-install
  ./scripts/admin-mvp-smoke-prep.sh --skip-install

옵션:
  -f, --force-install   APK가 이전과 같아도 npm run android:apk:install 실행
  --skip-install        설치 생략 (기동·logcat·체크리스트만)
  -h, --help            도움말

환경:
  ANDROID_SERIAL        다중 기기 시 대상 serial (미설정 시 install 스크립트와 동일하게 실기기 우선)
  LOG_WAIT_SEC          logcat 대기 초 (기본 5)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--force-install) FORCE_INSTALL=true; shift ;;
    --skip-install) SKIP_INSTALL=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "알 수 없는 옵션: $1" >&2; usage >&2; exit 1 ;;
  esac
done

file_mtime() {
  local f="$1"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    stat -f '%m' "$f"
  else
    stat -c '%Y' "$f"
  fi
}

adb_cmd() {
  if [[ -n "${ANDROID_SERIAL:-}" ]]; then
    adb -s "$ANDROID_SERIAL" "$@"
  else
    adb "$@"
  fi
}

pick_android_serial_if_needed() {
  if [[ -n "${ANDROID_SERIAL:-}" ]]; then
    return 0
  fi
  local lines
  lines="$(adb devices | awk '/\tdevice$/{print $1}')"
  local count
  count="$(printf '%s\n' "$lines" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ "$count" -eq 0 ]]; then
    echo "❌ adb 연결 기기 없음 (adb devices)" >&2
    exit 1
  fi
  if [[ "$count" -gt 1 ]]; then
    local physical
    physical="$(printf '%s\n' "$lines" | grep -v '^emulator-' | head -1 || true)"
    if [[ -n "$physical" ]]; then
      export ANDROID_SERIAL="$physical"
      echo "ℹ️  기기 ${count}대 — 실기기 우선: ANDROID_SERIAL=${ANDROID_SERIAL}"
    fi
  fi
}

resolve_apk() {
  local p
  for p in "${APK_CANDIDATES[@]}"; do
    if [[ -f "$p" ]]; then
      printf '%s' "$p"
      return 0
    fi
  done
  return 1
}

print_api_base_from_source() {
  local explicit="${EXPO_PUBLIC_API_BASE_URL:-}"
  explicit="${explicit//[[:space:]]/}"
  if [[ -n "$explicit" ]]; then
    explicit="${explicit%/}"
    echo "  app.config 기대 (EXPO_PUBLIC_API_BASE_URL): $explicit"
    return 0
  fi
  if [[ "${APP_ENV:-}" == "development" ]]; then
    echo "  app.config 기대 (APP_ENV=development): https://dev.core-solution.co.kr"
    return 0
  fi
  echo "  app.config 기대: (EXPO_PUBLIC_API_BASE_URL·APP_ENV=development 미설정 — 빌드 시 extra.apiBaseUrl 없을 수 있음)"
}

print_api_base_from_apk() {
  local apk="$1"
  echo "  APK embedded (assets/app.config):"
  if ! unzip -p "$apk" assets/app.config 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('   ', d.get('extra',{}).get('apiBaseUrl','(missing)'))" 2>/dev/null; then
    echo "    (파싱 실패)"
  fi
}

should_install_apk() {
  local apk="$1"
  if [[ "$FORCE_INSTALL" == true ]]; then
    return 0
  fi
  if [[ ! -f "$STAMP_FILE" ]]; then
    return 0
  fi
  local apk_m stamp_m
  apk_m="$(file_mtime "$apk")"
  stamp_m="$(tr -d '[:space:]' < "$STAMP_FILE" || echo 0)"
  [[ "$apk_m" -gt "$stamp_m" ]]
}

record_install_stamp() {
  local apk="$1"
  mkdir -p "$(dirname "$STAMP_FILE")"
  file_mtime "$apk" > "$STAMP_FILE"
}

print_manual_checklist() {
  cat <<'EOF'

======== 수동 스모크 — 사용자가 할 일 ========
(계정·비밀번호는 저장소에 없음. 팀 내부 채널 사용.)

1. 에뮬레이터(또는 실기기)에서 MindGarden 앱이 최신 release APK로 실행 중인지 확인.
2. ADMIN 또는 STAFF 권한 계정으로 로그인 (테넌트·자격 증명은 팀 내부 채널 사용).
3. 로그인 후 관리자 탭/홈 진입 — AdminRoleGate에 의해 비관리자는 차단되는지 확인.
4. MVP 범위 화면 스팟 체크 (테스트 플랜 문서 기준):
   - 홈 — /(admin)/(home) 대시·알림·오늘 일정·바로가기 로드
   - 검수 — /(admin)/(review) 대기 큐 목록 (ADMIN만; STAFF는 탭 숨김)
   - 운영 허브 — /(admin)/(operation) 메뉴 4종 (ADMIN: 스케줄·사용자·기록·마음날씨 / STAFF: 마음날씨 없음)
   - 스케줄 — /(admin)/(operation)/schedule 오늘 일정·당겨서 새로고침
   - 사용자 (Phase 2) — /(admin)/(operation)/users 역할 필터·검색·상세 모달(읽기 전용)
   - 상담일지 (Phase 2) — /(admin)/(operation)/records 상담사 선택 → 목록 → records/[id] 상세
   - 마음날씨 (Phase 2, ADMIN) — /(admin)/(operation)/mind-weather 요약·카드 (STAFF 진입 시 차단 UX)
   - 메시지 — /(admin)/(messages) 웹 어드민 안내·외부 링크 CTA
   - 더보기 — /(admin)/(more) 프로필·알림 설정·로그아웃
5. API 호출이 dev (https://dev.core-solution.co.kr) 로 가는지(환경 배너·네트워크 등 팀 관례대로) 확인.
6. 이상 시: adb logcat -c 후 재현 → ReactNativeJS|error|AdminRoleGate 필터 캡처.

==========================================
EOF
}

echo "======================================"
echo "  Admin MVP smoke prep"
echo "======================================"

echo ""
echo "▶ adb devices"
adb devices
pick_android_serial_if_needed

APK=""
if APK="$(resolve_apk)"; then
  echo ""
  echo "▶ APK: $APK ($(du -h "$APK" | awk '{print $1}'), mtime $(date -r "$(file_mtime "$APK")" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$(file_mtime "$APK")" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo '?'))"
  echo "▶ apiBaseUrl"
  print_api_base_from_source
  print_api_base_from_apk "$APK"
else
  echo ""
  echo "⚠️  release APK 없음. android:apk:dev 빌드 후 재실행하세요." >&2
  echo "▶ apiBaseUrl (소스 기대만)"
  print_api_base_from_source
fi

if [[ "$SKIP_INSTALL" != true ]]; then
  if [[ -z "$APK" ]]; then
    echo ""
    echo "❌ 설치 생략 불가: APK 없음" >&2
    exit 1
  fi
  if should_install_apk "$APK"; then
    echo ""
    echo "▶ npm run android:apk:install"
    npm run android:apk:install
    record_install_stamp "$APK"
  else
    echo ""
    echo "ℹ️  APK가 마지막 설치 시점보다 새롭지 않음 — 설치 생략 (--force-install 로 강제)"
  fi
fi

echo ""
echo "▶ MainActivity 기동: $MAIN_ACTIVITY"
adb_cmd shell am start -n "$MAIN_ACTIVITY" >/dev/null 2>&1 || true

echo ""
echo "▶ logcat (clear → ${LOG_WAIT_SEC}s 대기 → 필터 덤프)"
adb_cmd logcat -c
sleep "$LOG_WAIT_SEC"
echo "--- 필터: ReactNativeJS + (error|AdminRoleGate|Unable to resolve) ---"
adb_cmd logcat -d -t 400 2>/dev/null \
  | grep -iE 'ReactNativeJS|error|exception|AdminRoleGate|Unable to resolve' \
  | tail -40 || echo "(매칭 없음)"

print_manual_checklist

echo ""
echo "✅ smoke prep 완료"
