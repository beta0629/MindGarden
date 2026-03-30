#!/usr/bin/env bash
# 개발 서버 대상 심리검사 E2E (재로그인 후 목록 노출) 실행
# 기본 계정: beta74@live.co.kr / 12345678 (덮어쓰기: TEST_USERNAME=... TEST_PASSWORD=... ./scripts/run-psych-e2e-dev.sh)

cd "$(dirname "$0")/.."
export BASE_URL="${BASE_URL:-https://mindgarden.dev.core-solution.co.kr}"

# 기본값: 개발 서버 테스트용 계정 (덮어쓰려면 환경변수로 설정)
export TEST_USERNAME="${TEST_USERNAME:-beta74@live.co.kr}"
export TEST_PASSWORD="${TEST_PASSWORD:-12345678}"

exec npx playwright test tests/admin/psych-assessments-after-login.spec.ts \
  --config=playwright.manual.config.ts \
  --project=chromium \
  --reporter=list
