#!/bin/bash

# 타 지점 전체 테스트 스크립트 (간단 버전)
# 작성일: 2025-09-23
# 설명: 모든 지점의 주요 기능을 자동으로 테스트

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정
BASE_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:3000"
COOKIE_FILE="test_cookies.txt"
RESULTS_FILE="test_results_$(date +%Y%m%d_%H%M%S).txt"

# 지점별 테스트 계정 정보 (간단한 배열)
BRANCH_CODES=("HQ" "MAIN001" "GANGNAM" "HONGDAE" "JAMSIL" "SINCHON" "BUSAN" "DAEGU" "INCHEON" "GWANGJU")
BRANCH_EMAILS=("super_hq_admin@mindgarden.com" "superadmin@mindgarden.com" "gangnam_admin@mindgarden.com" "hongdae_admin@mindgarden.com" "jamsil_admin@mindgarden.com" "sinchon_admin@mindgarden.com" "busan_admin@mindgarden.com" "daegu_admin@mindgarden.com" "incheon_admin@mindgarden.com" "gwangju_admin@mindgarden.com")
BRANCH_PASSWORDS=("admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123")

# 테스트 결과 저장
declare -a TEST_RESULTS

# API 호출 함수
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -b $COOKIE_FILE \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -b $COOKIE_FILE \
            "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# 로그인 함수
login() {
    local email=$1
    local password=$2
    local branch_code=$3
    
    log_info "로그인 시도: $email (지점: $branch_code)"
    
    response=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "로그인 성공: $email"
        
        # 지점 매핑 (필요한 경우)
        if [ "$branch_code" != "HQ" ] && [ "$branch_code" != "MAIN001" ]; then
            log_info "지점 매핑 시도: $branch_code"
            curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/map-branch" \
                -H "Content-Type: application/json" \
                -d "{\"branchCode\":\"$branch_code\"}" > /dev/null
        fi
        
        return 0
    else
        log_error "로그인 실패: $email"
        return 1
    fi
}

# 로그아웃 함수
logout() {
    curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/logout" > /dev/null
    rm -f $COOKIE_FILE
    log_info "로그아웃 완료"
}

# 기본 API 테스트
test_basic_apis() {
    local branch_code=$1
    local test_name="기본 API 테스트"
    
    log_info "$test_name 시작 (지점: $branch_code)"
    
    local passed=0
    local total=0
    
    # 1. 현재 사용자 정보 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/auth/current-user" "" "200"; then
        log_success "✓ 현재 사용자 정보 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 현재 사용자 정보 조회 실패"
    fi
    
    # 2. 사용자 목록 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/admin/users?includeInactive=false" "" "200"; then
        log_success "✓ 사용자 목록 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 사용자 목록 조회 실패"
    fi
    
    # 3. 매핑 목록 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/admin/mappings?page=0&size=10" "" "200"; then
        log_success "✓ 매핑 목록 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 매핑 목록 조회 실패"
    fi
    
    # 4. 공통코드 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/admin/common-codes/values?groupCode=ROLE" "" "200"; then
        log_success "✓ 공통코드 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 공통코드 조회 실패"
    fi
    
    # 결과 반환
    echo "$passed/$total"
    
    if [ $passed -eq $total ]; then
        log_success "$test_name 완료: $passed/$total 통과"
        return 0
    else
        log_warning "$test_name 부분 성공: $passed/$total 통과"
        return 1
    fi
}

# ERP 대시보드 테스트
test_erp_dashboard() {
    local branch_code=$1
    local test_name="ERP 대시보드 테스트"
    
    log_info "$test_name 시작 (지점: $branch_code)"
    
    local passed=0
    local total=0
    
    # 1. 재무 대시보드 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/erp/finance/dashboard?branchCode=$branch_code" "" "200"; then
        log_success "✓ 재무 대시보드 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 재무 대시보드 조회 실패"
    fi
    
    # 2. 거래 내역 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/erp/transactions?page=0&size=10" "" "200"; then
        log_success "✓ 거래 내역 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 거래 내역 조회 실패"
    fi
    
    # 3. ERP 아이템 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/erp/items" "" "200"; then
        log_success "✓ ERP 아이템 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ ERP 아이템 조회 실패"
    fi
    
    # 결과 반환
    echo "$passed/$total"
    
    if [ $passed -eq $total ]; then
        log_success "$test_name 완료: $passed/$total 통과"
        return 0
    else
        log_warning "$test_name 부분 성공: $passed/$total 통과"
        return 1
    fi
}

# 환불 시스템 테스트
test_refund_system() {
    local branch_code=$1
    local test_name="환불 시스템 테스트"
    
    log_info "$test_name 시작 (지점: $branch_code)"
    
    local passed=0
    local total=0
    
    # 1. 환불 통계 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/admin/refund-statistics?period=month" "" "200"; then
        log_success "✓ 환불 통계 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 환불 통계 조회 실패"
    fi
    
    # 2. 환불 이력 조회
    total=$((total + 1))
    if api_call "GET" "$BASE_URL/api/admin/refund-history?page=0&size=10" "" "200"; then
        log_success "✓ 환불 이력 조회 성공"
        passed=$((passed + 1))
    else
        log_error "✗ 환불 이력 조회 실패"
    fi
    
    # 결과 반환
    echo "$passed/$total"
    
    if [ $passed -eq $total ]; then
        log_success "$test_name 완료: $passed/$total 통과"
        return 0
    else
        log_warning "$test_name 부분 성공: $passed/$total 통과"
        return 1
    fi
}

# 지점별 테스트 실행
test_branch() {
    local branch_code=$1
    local email=$2
    local password=$3
    
    log_info "=========================================="
    log_info "지점 테스트 시작: $branch_code"
    log_info "계정: $email"
    log_info "=========================================="
    
    # 로그인
    if ! login "$email" "$password" "$branch_code"; then
        log_error "지점 $branch_code 로그인 실패, 테스트 건너뜀"
        return 1
    fi
    
    # 테스트 실행
    local basic_result=$(test_basic_apis "$branch_code")
    local erp_result=$(test_erp_dashboard "$branch_code")
    local refund_result=$(test_refund_system "$branch_code")
    
    # 로그아웃
    logout
    
    # 결과 출력
    log_info "=========================================="
    log_info "지점 테스트 완료: $branch_code"
    log_info "기본 API: $basic_result"
    log_info "ERP 대시보드: $erp_result"
    log_info "환불 시스템: $refund_result"
    log_info "=========================================="
    
    # 결과 파일에 저장
    echo "지점: $branch_code" >> $RESULTS_FILE
    echo "기본 API: $basic_result" >> $RESULTS_FILE
    echo "ERP 대시보드: $erp_result" >> $RESULTS_FILE
    echo "환불 시스템: $refund_result" >> $RESULTS_FILE
    echo "----------------------------------------" >> $RESULTS_FILE
    
    return 0
}

# 메인 실행 함수
main() {
    log_info "타 지점 전체 테스트 시작"
    log_info "테스트 시간: $(date)"
    log_info "결과 파일: $RESULTS_FILE"
    
    # 결과 파일 초기화
    echo "타 지점 전체 테스트 결과" > $RESULTS_FILE
    echo "테스트 시간: $(date)" >> $RESULTS_FILE
    echo "==========================================" >> $RESULTS_FILE
    
    local total_branches=${#BRANCH_CODES[@]}
    local passed_branches=0
    
    # 각 지점별 테스트 실행
    for i in "${!BRANCH_CODES[@]}"; do
        local branch_code="${BRANCH_CODES[$i]}"
        local email="${BRANCH_EMAILS[$i]}"
        local password="${BRANCH_PASSWORDS[$i]}"
        
        if test_branch "$branch_code" "$email" "$password"; then
            passed_branches=$((passed_branches + 1))
        fi
        
        echo "" >> $RESULTS_FILE
    done
    
    # 최종 결과 출력
    log_info "=========================================="
    log_info "전체 테스트 완료"
    log_info "통과한 지점: $passed_branches/$total_branches"
    log_info "=========================================="
    
    echo "" >> $RESULTS_FILE
    echo "최종 결과" >> $RESULTS_FILE
    echo "통과한 지점: $passed_branches/$total_branches" >> $RESULTS_FILE
    echo "테스트 완료 시간: $(date)" >> $RESULTS_FILE
    
    # 결과 파일 출력
    log_info "상세 결과는 $RESULTS_FILE 파일을 확인하세요"
    cat $RESULTS_FILE
}

# 스크립트 실행
main "$@"
