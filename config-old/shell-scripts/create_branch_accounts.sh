#!/bin/bash

# 지점별 지점수퍼 관리자 계정 생성 스크립트
# 작성일: 2025-09-23
# 설명: 각 지점에 지점수퍼 관리자 계정을 생성하고 기본 데이터를 설정

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
COOKIE_FILE="admin_cookies.txt"

# 지점별 계정 정보
declare -a BRANCH_CODES=("GANGNAM" "HONGDAE" "JAMSIL" "SINCHON" "BUSAN" "DAEGU" "INCHEON" "GWANGJU")
declare -a BRANCH_NAMES=("강남점" "홍대점" "잠실점" "신촌점" "부산점" "대구점" "인천점" "광주점")
declare -a BRANCH_EMAILS=("gangnam_admin@mindgarden.com" "hongdae_admin@mindgarden.com" "jamsil_admin@mindgarden.com" "sinchon_admin@mindgarden.com" "busan_admin@mindgarden.com" "daegu_admin@mindgarden.com" "incheon_admin@mindgarden.com" "gwangju_admin@mindgarden.com")
declare -a BRANCH_PASSWORDS=("admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123" "admin123")

# 관리자 로그인
login_admin() {
    log_info "관리자 로그인 시도..."
    
    response=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "관리자 로그인 성공"
        return 0
    else
        log_error "관리자 로그인 실패"
        return 1
    fi
}

# 지점 계정 생성
create_branch_account() {
    local branch_code=$1
    local branch_name=$2
    local email=$3
    local password=$4
    
    log_info "지점 계정 생성: $branch_name ($branch_code) - $email"
    
    # 사용자 등록
    local user_data=$(cat <<EOF
{
    "email": "$email",
    "password": "$password",
    "name": "${branch_name} 관리자",
    "role": "BRANCH_SUPER_ADMIN",
    "phone": "010-1234-5678",
    "branchCode": "$branch_code",
    "isActive": true
}
EOF
)
    
    response=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/admin/users" \
        -H "Content-Type: application/json" \
        -d "$user_data")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "✓ 사용자 등록 성공: $email"
        
        # 지점 매핑
        log_info "지점 매핑 시도: $branch_code"
        map_response=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/map-branch" \
            -H "Content-Type: application/json" \
            -d "{\"branchCode\":\"$branch_code\"}")
        
        if echo "$map_response" | grep -q '"success":true'; then
            log_success "✓ 지점 매핑 성공: $branch_code"
        else
            log_warning "⚠ 지점 매핑 실패: $branch_code"
        fi
        
        return 0
    else
        log_error "✗ 사용자 등록 실패: $email"
        echo "응답: $response"
        return 1
    fi
}

# 테스트용 상담사 생성
create_test_consultant() {
    local branch_code=$1
    local consultant_name="${branch_code} 테스트상담사"
    local email="consultant_${branch_code,,}@mindgarden.com"
    
    log_info "테스트 상담사 생성: $consultant_name ($branch_code)"
    
    local consultant_data=$(cat <<EOF
{
    "email": "$email",
    "password": "consultant123",
    "name": "$consultant_name",
    "role": "CONSULTANT",
    "phone": "010-2345-6789",
    "branchCode": "$branch_code",
    "grade": "SENIOR",
    "specialty": "개인상담",
    "yearsOfExperience": 5,
    "isActive": true
}
EOF
)
    
    response=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/admin/consultants" \
        -H "Content-Type: application/json" \
        -d "$consultant_data")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "✓ 테스트 상담사 생성 성공: $consultant_name"
        return 0
    else
        log_error "✗ 테스트 상담사 생성 실패: $consultant_name"
        echo "응답: $response"
        return 1
    fi
}

# 테스트용 내담자 생성
create_test_client() {
    local branch_code=$1
    local client_name="${branch_code} 테스트내담자"
    local email="client_${branch_code,,}@mindgarden.com"
    
    log_info "테스트 내담자 생성: $client_name ($branch_code)"
    
    local client_data=$(cat <<EOF
{
    "email": "$email",
    "password": "client123",
    "name": "$client_name",
    "role": "CLIENT",
    "phone": "010-3456-7890",
    "branchCode": "$branch_code",
    "isActive": true
}
EOF
)
    
    response=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/admin/clients" \
        -H "Content-Type: application/json" \
        -d "$client_data")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "✓ 테스트 내담자 생성 성공: $client_name"
        return 0
    else
        log_error "✗ 테스트 내담자 생성 실패: $client_name"
        echo "응답: $response"
        return 1
    fi
}

# 매핑 생성
create_test_mapping() {
    local branch_code=$1
    local consultant_email="consultant_${branch_code,,}@mindgarden.com"
    local client_email="client_${branch_code,,}@mindgarden.com"
    
    log_info "테스트 매핑 생성: $branch_code"
    
    local mapping_data=$(cat <<EOF
{
    "consultantEmail": "$consultant_email",
    "clientEmail": "$client_email",
    "packageName": "기본 10회기 패키지",
    "packagePrice": 500000,
    "totalSessions": 10,
    "paymentMethod": "BANK_TRANSFER",
    "paymentReference": "TEST_${branch_code}_$(date +%Y%m%d)",
    "paymentAmount": 500000,
    "notes": "테스트 매핑 - $branch_code"
}
EOF
)
    
    response=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/admin/mappings" \
        -H "Content-Type: application/json" \
        -d "$mapping_data")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "✓ 테스트 매핑 생성 성공: $branch_code"
        return 0
    else
        log_error "✗ 테스트 매핑 생성 실패: $branch_code"
        echo "응답: $response"
        return 1
    fi
}

# 메인 실행 함수
main() {
    log_info "지점별 계정 생성 시작"
    log_info "생성할 지점 수: ${#BRANCH_CODES[@]}"
    
    # 관리자 로그인
    if ! login_admin; then
        log_error "관리자 로그인 실패로 스크립트 종료"
        exit 1
    fi
    
    local success_count=0
    local total_count=${#BRANCH_CODES[@]}
    
    # 각 지점별 계정 생성
    for i in "${!BRANCH_CODES[@]}"; do
        local branch_code="${BRANCH_CODES[$i]}"
        local branch_name="${BRANCH_NAMES[$i]}"
        local email="${BRANCH_EMAILS[$i]}"
        local password="${BRANCH_PASSWORDS[$i]}"
        
        log_info "=========================================="
        log_info "지점 계정 생성: $branch_name ($branch_code)"
        log_info "=========================================="
        
        # 1. 지점 관리자 계정 생성
        if create_branch_account "$branch_code" "$branch_name" "$email" "$password"; then
            # 2. 테스트용 상담사 생성
            create_test_consultant "$branch_code"
            
            # 3. 테스트용 내담자 생성
            create_test_client "$branch_code"
            
            # 4. 테스트 매핑 생성
            create_test_mapping "$branch_code"
            
            success_count=$((success_count + 1))
            log_success "지점 $branch_name 계정 생성 완료"
        else
            log_error "지점 $branch_name 계정 생성 실패"
        fi
        
        echo ""
    done
    
    # 로그아웃
    curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/logout" > /dev/null
    rm -f $COOKIE_FILE
    
    # 최종 결과
    log_info "=========================================="
    log_info "지점 계정 생성 완료"
    log_info "성공: $success_count/$total_count"
    log_info "=========================================="
    
    if [ $success_count -eq $total_count ]; then
        log_success "모든 지점 계정이 성공적으로 생성되었습니다!"
    else
        log_warning "일부 지점 계정 생성에 실패했습니다."
    fi
}

# 스크립트 실행
main "$@"
