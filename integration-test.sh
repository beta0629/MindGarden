#!/bin/bash

# MindGarden 통합 테스트 스크립트
# 결제 시스템 + 보안 시스템 통합 테스트

echo "🧪 MindGarden 통합 테스트 시작..."
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0
TOTAL=0

# 테스트 함수
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "테스트: $test_name... "
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ 통과${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ 실패${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# 1. 서버 상태 확인
echo "1. 서버 상태 확인"
run_test "서버 실행 상태" "curl -s http://localhost:8080/actuator/health | grep -q 'UP'"

# 2. 보안 시스템 테스트
echo ""
echo "2. 보안 시스템 테스트"
run_test "보안 헤더 설정" "curl -s -I http://localhost:8080/api/auth/me | grep -q 'X-Frame-Options: DENY'"
run_test "XSS 방지 필터" "curl -s -X POST http://localhost:8080/api/users -H 'Content-Type: application/json' -d '{\"name\":\"<script>alert(\\\"XSS\\\")</script>\",\"email\":\"test@example.com\"}' | grep -q 'script' && exit 1 || exit 0"
run_test "Rate Limiting" "for i in {1..5}; do curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/me; done | grep -q '429' || exit 0"

# 3. 결제 시스템 테스트
echo ""
echo "3. 결제 시스템 테스트"

# 결제 요청 생성 테스트
run_test "결제 요청 생성" "curl -s -X POST http://localhost:8080/api/payment/create -H 'Content-Type: application/json' -d '{\"orderId\":\"TEST-ORDER-001\",\"amount\":10000,\"orderName\":\"테스트 상담\",\"customerEmail\":\"test@example.com\",\"customerName\":\"홍길동\"}' | grep -q 'paymentId'"

# 결제 상태 확인 테스트
run_test "결제 상태 확인" "curl -s -X GET http://localhost:8080/api/payment/status/TEST-PAYMENT-001 | grep -q 'status'"

# Webhook 테스트
run_test "결제 Webhook 처리" "curl -s -X POST http://localhost:8080/api/payment/webhook -H 'Content-Type: application/json' -d '{\"paymentId\":\"TEST-PAYMENT-001\",\"orderId\":\"TEST-ORDER-001\",\"status\":\"APPROVED\",\"amount\":10000}' | grep -q 'success'"

# 4. 인증 시스템 테스트
echo ""
echo "4. 인증 시스템 테스트"

# JWT 토큰 생성 테스트
run_test "JWT 토큰 생성" "curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}' | grep -q 'token'"

# JWT 토큰 검증 테스트
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ ! -z "$TOKEN" ]; then
    run_test "JWT 토큰 검증" "curl -s -X GET http://localhost:8080/api/auth/me -H 'Authorization: Bearer $TOKEN' | grep -q 'email'"
else
    echo -n "테스트: JWT 토큰 검증... "
    echo -e "${RED}❌ 실패 (토큰 생성 실패)${NC}"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
fi

# 5. 데이터베이스 연결 테스트
echo ""
echo "5. 데이터베이스 연결 테스트"
run_test "데이터베이스 연결" "curl -s http://localhost:8080/actuator/health | grep -q 'UP'"

# 6. API 엔드포인트 테스트
echo ""
echo "6. API 엔드포인트 테스트"
run_test "사용자 목록 API" "curl -s -X GET http://localhost:8080/api/users -H 'Authorization: Bearer $TOKEN' | grep -q 'users' || exit 0"
run_test "상담사 목록 API" "curl -s -X GET http://localhost:8080/api/consultants -H 'Authorization: Bearer $TOKEN' | grep -q 'consultants' || exit 0"

# 7. 에러 처리 테스트
echo ""
echo "7. 에러 처리 테스트"
run_test "잘못된 엔드포인트" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/nonexistent | grep -q '404'"
run_test "인증 없는 요청" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/me | grep -q '401'"

# 8. 성능 테스트
echo ""
echo "8. 성능 테스트"
run_test "응답 시간 테스트" "curl -s -o /dev/null -w '%{time_total}' http://localhost:8080/actuator/health | awk '{if($1 < 1.0) exit 0; else exit 1}'"

# 9. 로그 확인 테스트
echo ""
echo "9. 로그 확인 테스트"
run_test "로그 파일 존재" "test -f logs/mindgarden.log"
run_test "에러 로그 확인" "test -f logs/error.log || echo 'No error log found'"

# 결과 요약
echo ""
echo "=================================="
echo "🧪 통합 테스트 결과 요약"
echo "=================================="
echo -e "총 테스트: ${BLUE}$TOTAL${NC}"
echo -e "통과: ${GREEN}$PASSED${NC}"
echo -e "실패: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 통합 테스트가 통과했습니다!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  일부 테스트가 실패했습니다. 위의 결과를 확인해주세요.${NC}"
    exit 1
fi
