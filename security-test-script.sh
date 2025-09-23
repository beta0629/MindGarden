#!/bin/bash

# Spring Security 보안 강화 시스템 테스트 스크립트
# 작성자: MindGarden
# 날짜: 2025-01-17

echo "🔍 Spring Security 보안 강화 시스템 테스트 시작"
echo "=================================================="

BASE_URL="http://localhost:8080"
TEST_RESULTS=()

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 결과 기록 함수
record_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASS${NC} - $message"
        TEST_RESULTS+=("PASS:$test_name")
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name: FAIL${NC} - $message"
        TEST_RESULTS+=("FAIL:$test_name")
    else
        echo -e "${YELLOW}⚠️  $test_name: WARN${NC} - $message"
        TEST_RESULTS+=("WARN:$test_name")
    fi
}

# HTTP 상태 코드 확인 함수
check_http_status() {
    local url="$1"
    local expected_status="$2"
    local test_name="$3"
    
    echo -e "${BLUE}🔍 테스트: $test_name${NC}"
    echo "   URL: $url"
    echo "   예상 상태: $expected_status"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        record_test "$test_name" "PASS" "HTTP $response (예상: $expected_status)"
    else
        record_test "$test_name" "FAIL" "HTTP $response (예상: $expected_status)"
    fi
    echo ""
}

# 인증된 요청 테스트 함수
check_authenticated_request() {
    local url="$1"
    local expected_status="$2"
    local test_name="$3"
    local session_cookie="$4"
    
    echo -e "${BLUE}🔍 테스트: $test_name${NC}"
    echo "   URL: $url"
    echo "   예상 상태: $expected_status"
    
    if [ -n "$session_cookie" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -b "$session_cookie" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        record_test "$test_name" "PASS" "HTTP $response (예상: $expected_status)"
    else
        record_test "$test_name" "FAIL" "HTTP $response (예상: $expected_status)"
    fi
    echo ""
}

echo "📋 테스트 시나리오:"
echo "1. 공개 API 접근 테스트"
echo "2. 인증 필요 API 접근 테스트 (인증 없이)"
echo "3. 권한별 API 접근 테스트"
echo "4. CSRF 보호 테스트"
echo "5. 세션 보안 테스트"
echo ""

# 서버 시작 대기
echo "⏳ 서버 시작 대기 중..."
sleep 10

# 서버 상태 확인
echo "🔍 서버 상태 확인"
server_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/test-simple/health")
if [ "$server_status" = "200" ]; then
    record_test "서버 상태" "PASS" "서버가 정상적으로 실행 중"
else
    record_test "서버 상태" "FAIL" "서버 응답: HTTP $server_status"
    echo "❌ 서버가 실행되지 않았습니다. 테스트를 중단합니다."
    exit 1
fi
echo ""

echo "🧪 1. 공개 API 접근 테스트"
echo "=========================="

# 공개 API 테스트 (permitAll)
check_http_status "$BASE_URL/api/test-simple/hello" "200" "공개 API - Hello"
check_http_status "$BASE_URL/api/test-simple/health" "200" "공개 API - Health Check"
check_http_status "$BASE_URL/api/health" "200" "공개 API - System Health"
check_http_status "$BASE_URL/error" "404" "공개 API - Error Page"

echo ""
echo "🧪 2. 인증 필요 API 접근 테스트 (인증 없이)"
echo "=========================================="

# 인증 필요 API 테스트 (인증 없이 접근 시 401 또는 403)
check_http_status "$BASE_URL/api/menu/structure" "401" "메뉴 구조 API - 인증 없이 접근"
check_http_status "$BASE_URL/api/admin/consultants" "401" "관리자 API - 인증 없이 접근"
check_http_status "$BASE_URL/api/erp/items" "401" "ERP API - 인증 없이 접근"
check_http_status "$BASE_URL/api/users" "401" "사용자 API - 인증 없이 접근"

echo ""
echo "🧪 3. 권한별 API 접근 테스트"
echo "============================"

# 로그인 테스트 (super_hq_admin@mindgarden.com)
echo "🔐 테스트용 계정으로 로그인 시도"
login_response=$(curl -s -c cookies.txt -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "super_hq_admin@mindgarden.com",
        "password": "admin123"
    }')

echo "로그인 응답: $login_response"

# 로그인 성공 여부 확인
if echo "$login_response" | grep -q '"success":true'; then
    record_test "로그인" "PASS" "테스트 계정 로그인 성공"
    session_cookie="cookies.txt"
else
    record_test "로그인" "FAIL" "테스트 계정 로그인 실패"
    session_cookie=""
fi

if [ -n "$session_cookie" ]; then
    echo ""
    echo "🔍 로그인된 상태에서 API 접근 테스트"
    
    # HQ_MASTER 권한으로 접근 가능한 API 테스트
    check_authenticated_request "$BASE_URL/api/menu/structure" "200" "메뉴 구조 API - 로그인 후 접근" "$session_cookie"
    check_authenticated_request "$BASE_URL/api/admin/consultants" "200" "관리자 API - 로그인 후 접근" "$session_cookie"
    check_authenticated_request "$BASE_URL/api/erp/items" "200" "ERP API - 로그인 후 접근" "$session_cookie"
    
    # 사용자 권한 정보 조회 테스트
    echo "🔍 사용자 권한 정보 조회 테스트"
    permissions_response=$(curl -s -b "$session_cookie" "$BASE_URL/api/menu/permissions")
    echo "권한 정보 응답: $permissions_response"
    
    if echo "$permissions_response" | grep -q '"authenticated":true'; then
        record_test "권한 정보 조회" "PASS" "사용자 권한 정보 조회 성공"
    else
        record_test "권한 정보 조회" "FAIL" "사용자 권한 정보 조회 실패"
    fi
fi

echo ""
echo "🧪 4. CSRF 보호 테스트"
echo "======================"

# CSRF 토큰 조회 테스트
echo "🔍 CSRF 토큰 조회 테스트"
csrf_response=$(curl -s -b "$session_cookie" "$BASE_URL/api/auth/csrf-token")
echo "CSRF 토큰 응답: $csrf_response"

if echo "$csrf_response" | grep -q '"success":true'; then
    record_test "CSRF 토큰 조회" "PASS" "CSRF 토큰 조회 성공"
    
    # CSRF 토큰 추출
    csrf_token=$(echo "$csrf_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "CSRF 토큰: ${csrf_token:0:20}..."
    
    # CSRF 토큰 없이 POST 요청 테스트
    echo "🔍 CSRF 토큰 없이 POST 요청 테스트"
    csrf_fail_response=$(curl -s -o /dev/null -w "%{http_code}" -b "$session_cookie" \
        -X POST "$BASE_URL/api/auth/logout")
    
    if [ "$csrf_fail_response" = "403" ]; then
        record_test "CSRF 보호" "PASS" "CSRF 토큰 없이 POST 요청 차단됨"
    else
        record_test "CSRF 보호" "FAIL" "CSRF 보호가 작동하지 않음 (HTTP $csrf_fail_response)"
    fi
    
    # CSRF 토큰과 함께 POST 요청 테스트
    if [ -n "$csrf_token" ]; then
        echo "🔍 CSRF 토큰과 함께 POST 요청 테스트"
        csrf_success_response=$(curl -s -o /dev/null -w "%{http_code}" -b "$session_cookie" \
            -X POST "$BASE_URL/api/auth/logout" \
            -H "X-XSRF-TOKEN: $csrf_token")
        
        if [ "$csrf_success_response" = "200" ]; then
            record_test "CSRF 토큰 인증" "PASS" "CSRF 토큰과 함께 POST 요청 성공"
        else
            record_test "CSRF 토큰 인증" "FAIL" "CSRF 토큰과 함께 POST 요청 실패 (HTTP $csrf_success_response)"
        fi
    fi
else
    record_test "CSRF 토큰 조회" "FAIL" "CSRF 토큰 조회 실패"
fi

echo ""
echo "🧪 5. 세션 보안 테스트"
echo "======================"

# 세션 정보 조회 테스트
echo "🔍 세션 정보 조회 테스트"
session_response=$(curl -s -b "$session_cookie" "$BASE_URL/api/auth/session-info")
echo "세션 정보 응답: $session_response"

if echo "$session_response" | grep -q '"email"'; then
    record_test "세션 정보" "PASS" "세션 정보 조회 성공"
else
    record_test "세션 정보" "FAIL" "세션 정보 조회 실패"
fi

# 로그아웃 테스트
echo "🔍 로그아웃 테스트"
logout_response=$(curl -s -o /dev/null -w "%{http_code}" -b "$session_cookie" \
    -X POST "$BASE_URL/api/auth/logout" \
    -H "X-XSRF-TOKEN: $csrf_token")

if [ "$logout_response" = "200" ]; then
    record_test "로그아웃" "PASS" "로그아웃 성공"
else
    record_test "로그아웃" "FAIL" "로그아웃 실패 (HTTP $logout_response)"
fi

# 로그아웃 후 세션 무효화 테스트
echo "🔍 로그아웃 후 세션 무효화 테스트"
invalid_session_response=$(curl -s -o /dev/null -w "%{http_code}" -b "$session_cookie" \
    "$BASE_URL/api/auth/session-info")

if [ "$invalid_session_response" = "401" ]; then
    record_test "세션 무효화" "PASS" "로그아웃 후 세션 무효화됨"
else
    record_test "세션 무효화" "FAIL" "로그아웃 후 세션이 여전히 유효함 (HTTP $invalid_session_response)"
fi

echo ""
echo "📊 테스트 결과 요약"
echo "=================="

pass_count=0
fail_count=0
warn_count=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS:* ]]; then
        ((pass_count++))
    elif [[ $result == FAIL:* ]]; then
        ((fail_count++))
    elif [[ $result == WARN:* ]]; then
        ((warn_count++))
    fi
done

total_tests=$((pass_count + fail_count + warn_count))

echo -e "총 테스트: ${BLUE}$total_tests${NC}"
echo -e "성공: ${GREEN}$pass_count${NC}"
echo -e "실패: ${RED}$fail_count${NC}"
echo -e "경고: ${YELLOW}$warn_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 모든 보안 테스트가 통과했습니다!${NC}"
    echo -e "${GREEN}Spring Security 보안 강화가 성공적으로 구현되었습니다.${NC}"
else
    echo ""
    echo -e "${RED}⚠️  일부 테스트가 실패했습니다. 보안 설정을 확인해주세요.${NC}"
fi

echo ""
echo "🔍 실패한 테스트 상세:"
for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == FAIL:* ]]; then
        test_name=$(echo "$result" | cut -d':' -f2-)
        echo -e "${RED}❌ $test_name${NC}"
    fi
done

# 정리
rm -f cookies.txt

echo ""
echo "🔍 테스트 완료"
echo "=============="
