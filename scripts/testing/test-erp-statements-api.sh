#!/usr/bin/env bash
# 재무제표 API 테스트 스크립트
# GET /api/v1/erp/accounting/statements/balance, GET .../statements/income
# 사용법:
#   BASE_URL=https://dev.core-solution.co.kr TENANT_ID=your-tenant-id ./scripts/testing/test-erp-statements-api.sh
#   또는 로그인 후 쿠키로:
#   BASE_URL=https://dev.core-solution.co.kr COOKIE="JSESSIONID=xxx" TENANT_ID=your-tenant-id ./scripts/testing/test-erp-statements-api.sh
#
# 참고: 재무제표 API는 세션 인증 + TenantContext 사용. 브라우저에서 로그인한 뒤 개발자도구에서
# Application → Cookies → JSESSIONID 값을 복사해 COOKIE 환경변수로 넘기거나, 동일 도메인에서
# 먼저 로그인 API를 호출해 쿠키를 받은 뒤 사용하세요.

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:8080}"
TENANT_ID="${TENANT_ID:-}"
COOKIE="${COOKIE:-}"
# 날짜: 오늘 기준
AS_OF_DATE="${AS_OF_DATE:-$(date +%Y-%m-%d)}"
START_DATE="${START_DATE:-$(date +%Y-%m-01)}"
END_DATE="${END_DATE:-$(date +%Y-%m-%d)}"

echo "=========================================="
echo "재무제표 API 테스트"
echo "=========================================="
echo "BASE_URL=$BASE_URL"
echo "TENANT_ID=$TENANT_ID"
echo "AS_OF_DATE (balance)=$AS_OF_DATE"
echo "START_DATE/END_DATE (income)=$START_DATE ~ $END_DATE"
echo ""

if [ -z "$TENANT_ID" ]; then
  echo -e "${YELLOW}경고: TENANT_ID가 비어 있습니다. 서버가 세션에서 tenantId를 쓰면 동작할 수 있습니다.${NC}"
fi

CURL_OPTS=(-s -w "\n%{http_code}" -H "Content-Type: application/json")
if [ -n "$TENANT_ID" ]; then
  CURL_OPTS+=(-H "X-Tenant-Id: $TENANT_ID")
fi
if [ -n "$COOKIE" ]; then
  CURL_OPTS+=(-H "Cookie: $COOKIE")
fi

# curl 종료 코드 캡처 (set -e 회피)
CURL_EXIT_BALANCE=0
CURL_EXIT_INCOME=0

# 1) 재무상태표 GET .../statements/balance?asOfDate=...
echo -e "${YELLOW}[1/2] 재무상태표 GET /api/v1/erp/accounting/statements/balance${NC}"
RESP_BALANCE=$(curl "${CURL_OPTS[@]}" "${BASE_URL}/api/v1/erp/accounting/statements/balance?asOfDate=${AS_OF_DATE}") || CURL_EXIT_BALANCE=$?
HTTP_BALANCE=$(echo "$RESP_BALANCE" | tail -n1)
BODY_BALANCE=$(echo "$RESP_BALANCE" | sed '$d')
if [ "$HTTP_BALANCE" = "200" ]; then
  echo -e "${GREEN}HTTP 200 OK${NC}"
  echo "$BODY_BALANCE" | head -c 500
  echo ""
  if echo "$BODY_BALANCE" | grep -q '"success":true'; then
    echo -e "${GREEN}응답 success: true 확인${NC}"
  else
    echo -e "${YELLOW}응답에 success: true 없음 (body 확인)${NC}"
  fi
else
  echo -e "${RED}HTTP $HTTP_BALANCE${NC}"
  echo "$BODY_BALANCE"
  if [ "$HTTP_BALANCE" = "401" ] || [ "$HTTP_BALANCE" = "403" ]; then
    echo -e "${YELLOW}안내: 인증이 필요합니다. 브라우저에서 로그인 후 개발자도구 → Application → Cookies에서 JSESSIONID 값을 복사해 COOKIE 환경변수로 넘겨 주세요. 예: COOKIE=\"JSESSIONID=xxx\" $0${NC}"
  fi
fi
if [ "${CURL_EXIT_BALANCE:-0}" -ne 0 ]; then
  echo -e "${YELLOW}안내: curl 종료 코드 $CURL_EXIT_BALANCE (연결/SSL 오류). 개발 서버(https)라면 인증서 또는 네트워크를 확인하세요. 로그인 후 COOKIE=JSESSIONID=... 로 재시도하세요.${NC}"
fi
echo ""

# 2) 손익계산서 GET .../statements/income?startDate=...&endDate=...
echo -e "${YELLOW}[2/2] 손익계산서 GET /api/v1/erp/accounting/statements/income${NC}"
RESP_INCOME=$(curl "${CURL_OPTS[@]}" "${BASE_URL}/api/v1/erp/accounting/statements/income?startDate=${START_DATE}&endDate=${END_DATE}") || CURL_EXIT_INCOME=$?
HTTP_INCOME=$(echo "$RESP_INCOME" | tail -n1)
BODY_INCOME=$(echo "$RESP_INCOME" | sed '$d')
if [ "$HTTP_INCOME" = "200" ]; then
  echo -e "${GREEN}HTTP 200 OK${NC}"
  echo "$BODY_INCOME" | head -c 500
  echo ""
  if echo "$BODY_INCOME" | grep -q '"success":true'; then
    echo -e "${GREEN}응답 success: true 확인${NC}"
  else
    echo -e "${YELLOW}응답에 success: true 없음 (body 확인)${NC}"
  fi
else
  echo -e "${RED}HTTP $HTTP_INCOME${NC}"
  echo "$BODY_INCOME"
  if [ "$HTTP_INCOME" = "401" ] || [ "$HTTP_INCOME" = "403" ]; then
    echo -e "${YELLOW}안내: 인증이 필요합니다. 브라우저에서 로그인 후 JSESSIONID 쿠키를 COOKIE 환경변수로 넘겨 주세요.${NC}"
  fi
fi
if [ "${CURL_EXIT_INCOME:-0}" -ne 0 ]; then
  echo -e "${YELLOW}안내: curl 종료 코드 $CURL_EXIT_INCOME (연결/SSL 오류). 개발 서버라면 인증서 또는 네트워크를 확인하고, 로그인 후 COOKIE=JSESSIONID=... 로 재시도하세요.${NC}"
fi
echo ""

echo "=========================================="
if [ "$HTTP_BALANCE" = "200" ] && [ "$HTTP_INCOME" = "200" ]; then
  echo -e "${GREEN}재무제표 API 테스트 통과 (200)${NC}"
  exit 0
else
  echo -e "${RED}일부 요청 실패 (balance=$HTTP_BALANCE, income=$HTTP_INCOME)${NC}"
  echo "개발 서버 사용 시: 로그인 후 Cookie(JSESSIONID)와 X-Tenant-Id 헤더를 설정하세요."
  if [ "${CURL_EXIT_BALANCE:-0}" -eq 60 ] || [ "${CURL_EXIT_INCOME:-0}" -eq 60 ]; then
    echo -e "${YELLOW}SSL/연결 오류(exit 60). 개발 서버(https)라면 인증서 또는 네트워크를 확인하세요. 로그인 후 COOKIE=JSESSIONID=... 로 재시도하세요.${NC}"
  fi
  if [ "$HTTP_BALANCE" = "401" ] || [ "$HTTP_BALANCE" = "403" ] || [ "$HTTP_INCOME" = "401" ] || [ "$HTTP_INCOME" = "403" ]; then
    echo -e "${YELLOW}401/403: 인증이 필요합니다. 브라우저에서 로그인 후 JSESSIONID 쿠키를 COOKIE 환경변수로 넘겨 주세요.${NC}"
  fi
  exit 1
fi
