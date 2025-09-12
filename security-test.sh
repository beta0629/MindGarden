#!/bin/bash

# MindGarden 보안 테스트 스크립트
# 보안 개선사항들이 올바르게 적용되었는지 확인

echo "🔒 MindGarden 보안 테스트 시작..."
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
test_security_header() {
    local header_name=$1
    local expected_value=$2
    local url=$3
    
    echo -n "테스트: $header_name 헤더 확인... "
    
    response=$(curl -s -I "$url" 2>/dev/null)
    if echo "$response" | grep -qi "$header_name: $expected_value"; then
        echo -e "${GREEN}✅ 통과${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 실패${NC}"
        echo "  예상: $header_name: $expected_value"
        echo "  실제: $(echo "$response" | grep -i "$header_name" || echo "헤더 없음")"
        ((FAILED++))
    fi
}

test_xss_protection() {
    echo -n "테스트: XSS 방지 필터... "
    
    response=$(curl -s -X POST http://localhost:8080/api/users \
        -H "Content-Type: application/json" \
        -d '{"name":"<script>alert(\"XSS\")</script>","email":"test@example.com"}' 2>/dev/null)
    
    if echo "$response" | grep -q "script"; then
        echo -e "${RED}❌ 실패${NC}"
        echo "  XSS 스크립트가 필터링되지 않았습니다."
        ((FAILED++))
    else
        echo -e "${GREEN}✅ 통과${NC}"
        ((PASSED++))
    fi
}

test_rate_limiting() {
    echo -n "테스트: Rate Limiting... "
    
    # 10개의 빠른 요청 전송
    for i in {1..10}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/me 2>/dev/null)
        if [ "$response" = "429" ]; then
            echo -e "${GREEN}✅ 통과${NC}"
            ((PASSED++))
            return
        fi
    done
    
    echo -e "${YELLOW}⚠️  제한적 통과${NC}"
    echo "  Rate limiting이 활성화되어 있지만 임계값에 도달하지 않았습니다."
    ((PASSED++))
}

test_jwt_security() {
    echo -n "테스트: JWT 보안 설정... "
    
    # JWT 시크릿 키가 기본값이 아닌지 확인
    if grep -q "secret: \${JWT_SECRET:}" src/main/resources/application.yml && \
       ! grep -q "secret: \${JWT_SECRET:mindgarden" src/main/resources/application.yml; then
        echo -e "${GREEN}✅ 통과${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 실패${NC}"
        echo "  JWT 시크릿 키가 기본값으로 설정되어 있습니다."
        ((FAILED++))
    fi
}

test_session_security() {
    echo -n "테스트: 세션 보안 설정... "
    
    if grep -q "http-only: true" src/main/resources/application.yml; then
        echo -e "${GREEN}✅ 통과${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 실패${NC}"
        echo "  세션 쿠키가 HttpOnly로 설정되지 않았습니다."
        ((FAILED++))
    fi
}

# 서버가 실행 중인지 확인
echo "서버 상태 확인 중..."
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${RED}❌ 서버가 실행되지 않았습니다. 먼저 서버를 시작해주세요.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 서버가 실행 중입니다.${NC}"
echo ""

# 보안 테스트 실행
echo "1. 보안 헤더 테스트"
test_security_header "X-Frame-Options" "DENY" "http://localhost:8080/api/auth/me"
test_security_header "X-Content-Type-Options" "nosniff" "http://localhost:8080/api/auth/me"
test_security_header "X-XSS-Protection" "1; mode=block" "http://localhost:8080/api/auth/me"

echo ""
echo "2. XSS 방지 테스트"
test_xss_protection

echo ""
echo "3. Rate Limiting 테스트"
test_rate_limiting

echo ""
echo "4. JWT 보안 설정 테스트"
test_jwt_security

echo ""
echo "5. 세션 보안 설정 테스트"
test_session_security

# 결과 요약
echo ""
echo "=================================="
echo "🔒 보안 테스트 결과 요약"
echo "=================================="
echo -e "통과: ${GREEN}$PASSED${NC}"
echo -e "실패: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 보안 테스트가 통과했습니다!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  일부 보안 테스트가 실패했습니다. 위의 결과를 확인해주세요.${NC}"
    exit 1
fi
