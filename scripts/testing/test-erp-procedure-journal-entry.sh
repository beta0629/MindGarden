#!/bin/bash

# ERP 프로시저 자동 분개 생성 테스트 스크립트
# 
# 사용법:
#   ./scripts/testing/test-erp-procedure-journal-entry.sh [tenant-id] [mapping-id]
#
# 예시:
#   ./scripts/testing/test-erp-procedure-journal-entry.sh "test-tenant-001" 1

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 기본값 설정
TENANT_ID=${1:-"test-tenant-001"}
MAPPING_ID=${2:-1}
BASE_URL=${BASE_URL:-"http://localhost:8080"}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ERP 프로시저 자동 분개 생성 테스트${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "테넌트 ID: ${GREEN}${TENANT_ID}${NC}"
echo -e "매핑 ID: ${GREEN}${MAPPING_ID}${NC}"
echo -e "베이스 URL: ${GREEN}${BASE_URL}${NC}"
echo ""

# 1. ApplyDiscountAccounting 테스트
echo -e "${YELLOW}[1/3] ApplyDiscountAccounting 프로시저 테스트${NC}"
echo "할인 적용 프로시저 실행 중..."

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/admin/plsql-discount-accounting/apply" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: ${TENANT_ID}" \
  -d "{
    \"mappingId\": ${MAPPING_ID},
    \"discountCode\": \"TEST-DISCOUNT-$(date +%s)\",
    \"originalAmount\": 100000,
    \"discountAmount\": 10000,
    \"finalAmount\": 90000,
    \"appliedBy\": \"test-user\"
  }")

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ 프로시저 실행 성공${NC}"
    echo "응답: $RESPONSE"
else
    echo -e "${RED}❌ 프로시저 실행 실패${NC}"
    echo "응답: $RESPONSE"
    exit 1
fi

echo ""
sleep 2

# 2. 생성된 분개 확인
echo -e "${YELLOW}[2/3] 생성된 분개 확인${NC}"
echo "분개 목록 조회 중..."

JOURNAL_ENTRIES=$(curl -s -X GET "${BASE_URL}/api/v1/erp/accounting/entries" \
  -H "X-Tenant-Id: ${TENANT_ID}")

ENTRY_COUNT=$(echo $JOURNAL_ENTRIES | grep -o '"id"' | wc -l | tr -d ' ')

if [ "$ENTRY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 분개 생성 확인: ${ENTRY_COUNT}개${NC}"
    echo "분개 목록: $JOURNAL_ENTRIES"
else
    echo -e "${YELLOW}⚠️ 분개가 생성되지 않았습니다 (계정 설정 확인 필요)${NC}"
fi

echo ""
sleep 2

# 3. FinancialTransaction 확인
echo -e "${YELLOW}[3/3] FinancialTransaction 확인${NC}"
echo "거래 목록 조회 중..."

TRANSACTIONS=$(curl -s -X GET "${BASE_URL}/api/v1/erp/financial/transactions?tenantId=${TENANT_ID}" \
  -H "X-Tenant-Id: ${TENANT_ID}")

TRANSACTION_COUNT=$(echo $TRANSACTIONS | grep -o '"id"' | wc -l | tr -d ' ')

if [ "$TRANSACTION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 거래 생성 확인: ${TRANSACTION_COUNT}개${NC}"
else
    echo -e "${YELLOW}⚠️ 거래가 생성되지 않았습니다${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}테스트 완료${NC}"
echo -e "${BLUE}========================================${NC}"

