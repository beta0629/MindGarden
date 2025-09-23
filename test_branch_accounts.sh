#!/bin/bash

# 지점별 계정 테스트 스크립트
# 작성일: 2025-09-23
# 설명: 각 지점의 지점수퍼 관리자 계정으로 로그인하여 기능 테스트

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
LOGIN_URL="${BASE_URL}/api/auth/login"
CURRENT_USER_URL="${BASE_URL}/api/auth/current-user"
USERS_URL="${BASE_URL}/api/admin/users?includeInactive=false"
MAPPINGS_URL="${BASE_URL}/api/admin/mappings"
COMMON_CODES_URL="${BASE_URL}/api/admin/common-codes/values?groupCode=ROLE"
ERP_DASHBOARD_URL="${BASE_URL}/api/erp/dashboard"
REFUND_STATS_URL="${BASE_URL}/api/admin/refund-statistics?period=month"

# 지점별 계정 정보
declare -a BRANCH_CODES=("GANGNAM" "HONGDAE" "JAMSIL" "SINCHON" "BUSAN" "DAEGU" "INCHEON" "GWANGJU")
declare -a BRANCH_NAMES=("강남점" "홍대점" "잠실점" "신촌점" "부산점" "대구점" "인천점" "광주점")
declare -a BRANCH_EMAILS=("gangnam_admin@mindgarden.com" "hongdae_admin@mindgarden.com" "jamsil_admin@mindgarden.com" "sinchon_admin@mindgarden.com" "busan_admin@mindgarden.com" "daegu_admin@mindgarden.com" "incheon_admin@mindgarden.com" "gwangju_admin@mindgarden.com")
declare -a BRANCH_PASSWORDS=("admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123")

# 결과 파일 설정
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_FILE="branch_test_results_${TIMESTAMP}.txt"

# 지점 계정 테스트
test_branch_account() {
    local branch_code=$1
    local branch_name=$2
    local email=$3
    local password=$4
    local cookie_file="cookies_${branch_code}.txt"
    
    log_info "=========================================="
    log_info "지점 테스트 시작: $branch_name ($branch_code)"
    log_info "계정: $email"
    log_info "=========================================="
    
    # 로그인 시도
    log_info "로그인 시도: $email"
    login_response=$(curl -s -c "$cookie_file" -X POST "$LOGIN_URL" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
    if echo "$login_response" | grep -q '"success":true'; then
        log_success "✓ 로그인 성공: $email"
        
        # 현재 사용자 정보 조회
        log_info "현재 사용자 정보 조회..."
        current_user_response=$(curl -s -b "$cookie_file" "$CURRENT_USER_URL")
        if echo "$current_user_response" | grep -q '"success":true'; then
            log_success "✓ 현재 사용자 정보 조회 성공"
            echo "사용자 정보: $(echo "$current_user_response" | jq -r '.user.name // "N/A"') ($(echo "$current_user_response" | jq -r '.user.role // "N/A"'))"
        else
            log_error "✗ 현재 사용자 정보 조회 실패"
            echo "응답: $current_user_response"
        fi
        
        # 사용자 목록 조회
        log_info "사용자 목록 조회..."
        users_response=$(curl -s -b "$cookie_file" "$USERS_URL")
        if echo "$users_response" | grep -q '"success":true'; then
            log_success "✓ 사용자 목록 조회 성공"
        else
            log_error "✗ 사용자 목록 조회 실패"
            echo "응답: $users_response"
        fi
        
        # 매핑 목록 조회
        log_info "매핑 목록 조회..."
        mappings_response=$(curl -s -b "$cookie_file" "$MAPPINGS_URL")
        if echo "$mappings_response" | grep -q "id"; then
            log_success "✓ 매핑 목록 조회 성공"
        else
            log_error "✗ 매핑 목록 조회 실패"
            echo "응답: $mappings_response"
        fi
        
        # 공통코드 조회
        log_info "공통코드 조회..."
        common_codes_response=$(curl -s -b "$cookie_file" "$COMMON_CODES_URL")
        if echo "$common_codes_response" | grep -q "codeGroup"; then
            log_success "✓ 공통코드 조회 성공"
        else
            log_error "✗ 공통코드 조회 실패"
            echo "응답: $common_codes_response"
        fi
        
        # ERP 대시보드 조회
        log_info "ERP 대시보드 조회..."
        erp_dashboard_response=$(curl -s -b "$cookie_file" "$ERP_DASHBOARD_URL")
        if echo "$erp_dashboard_response" | grep -q '"success":true'; then
            log_success "✓ ERP 대시보드 조회 성공"
        else
            log_error "✗ ERP 대시보드 조회 실패"
            echo "응답: $erp_dashboard_response"
        fi
        
        # 환불 통계 조회
        log_info "환불 통계 조회..."
        refund_stats_response=$(curl -s -b "$cookie_file" "$REFUND_STATS_URL")
        if echo "$refund_stats_response" | grep -q '"success":true'; then
            log_success "✓ 환불 통계 조회 성공"
        else
            log_error "✗ 환불 통계 조회 실패"
            echo "응답: $refund_stats_response"
        fi
        
        # 로그아웃
        curl -s -b "$cookie_file" -X POST "${BASE_URL}/api/auth/logout" > /dev/null
        log_info "로그아웃 완료"
        
        return 0
    else
        log_error "✗ 로그인 실패: $email"
        echo "응답: $login_response"
        return 1
    fi
}

# 메인 실행 함수
main() {
    log_info "지점별 계정 테스트 시작"
    log_info "테스트할 지점 수: ${#BRANCH_CODES[@]}"
    log_info "결과 파일: $RESULT_FILE"
    
    local success_count=0
    local total_count=${#BRANCH_CODES[@]}
    
    # 각 지점별 테스트
    for i in "${!BRANCH_CODES[@]}"; do
        local branch_code="${BRANCH_CODES[$i]}"
        local branch_name="${BRANCH_NAMES[$i]}"
        local email="${BRANCH_EMAILS[$i]}"
        local password="${BRANCH_PASSWORDS[$i]}"
        
        if test_branch_account "$branch_code" "$branch_name" "$email" "$password"; then
            success_count=$((success_count + 1))
        fi
        
        echo ""
    done
    
    # 최종 결과
    log_info "=========================================="
    log_info "지점 계정 테스트 완료"
    log_info "성공: $success_count/$total_count"
    log_info "=========================================="
    
    if [ $success_count -eq $total_count ]; then
        log_success "모든 지점 계정이 정상적으로 작동합니다!"
    else
        log_warning "일부 지점 계정에 문제가 있습니다."
    fi
}

# 스크립트 실행
main "$@"
