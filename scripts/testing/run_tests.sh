#!/bin/bash

# 표준화 작업 후 테스트 실행 스크립트
# 사용법: ./run_tests.sh [phase]
# phase: all, procedure, service, api, role, frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Phase 1: 프로시저 테스트
test_procedures() {
    log_info "Phase 1: 프로시저 표준화 테스트 시작"
    
    # 개발 서버 MySQL 접속 정보
    DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
    DB_USER="${DB_USER:-root}"
    DB_PASS="${DB_PASS:-qwer1234}"
    DB_NAME="${DB_NAME:-mindgarden}"
    
    log_info "MySQL 접속: $DB_HOST/$DB_NAME"
    
    # 프로시저 테스트 SQL 실행
    if command -v mysql &> /dev/null; then
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SCRIPT_DIR/test_procedure_standardization.sql"
        if [ $? -eq 0 ]; then
            log_info "프로시저 테스트 완료"
        else
            log_error "프로시저 테스트 실패"
            return 1
        fi
    else
        log_warn "mysql 명령어를 찾을 수 없습니다. 수동으로 실행하세요:"
        log_warn "mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < $SCRIPT_DIR/test_procedure_standardization.sql"
    fi
}

# Phase 2: Service 계층 테스트
test_services() {
    log_info "Phase 2: Service 계층 표준화 테스트 시작"
    
    cd "$PROJECT_ROOT"
    
    # Java 테스트 실행
    if [ -f "gradlew" ]; then
        log_info "Gradle 테스트 실행 중..."
        ./gradlew test --tests "*ServiceStandardizationTest" || {
            log_error "Service 계층 테스트 실패"
            return 1
        }
        log_info "Service 계층 테스트 완료"
    else
        log_warn "gradlew를 찾을 수 없습니다. IDE에서 테스트를 실행하세요."
    fi
}

# Phase 3: API 테스트
test_api() {
    log_info "Phase 3: API 경로 표준화 테스트 시작"
    
    cd "$PROJECT_ROOT"
    
    # Node.js 테스트 실행
    if command -v node &> /dev/null; then
        log_info "API 경로 테스트 실행 중..."
        node "$SCRIPT_DIR/test_api_standardization.js" || {
            log_error "API 테스트 실패"
            return 1
        }
        log_info "API 테스트 완료"
    else
        log_warn "node 명령어를 찾을 수 없습니다. 수동으로 실행하세요:"
        log_warn "node $SCRIPT_DIR/test_api_standardization.js"
    fi
}

# Phase 4: 역할 시스템 테스트
test_roles() {
    log_info "Phase 4: 역할 시스템 표준화 테스트 시작"
    
    cd "$PROJECT_ROOT"
    
    # Java 테스트 실행
    if [ -f "gradlew" ]; then
        log_info "역할 시스템 테스트 실행 중..."
        ./gradlew test --tests "*RoleStandardizationTest" || {
            log_warn "역할 시스템 테스트 클래스를 찾을 수 없습니다."
        }
        log_info "역할 시스템 테스트 완료"
    else
        log_warn "gradlew를 찾을 수 없습니다."
    fi
}

# Phase 5: 프론트엔드 테스트
test_frontend() {
    log_info "Phase 5: 프론트엔드 표준화 테스트 시작"
    
    cd "$PROJECT_ROOT/frontend"
    
    # npm 테스트 실행
    if [ -f "package.json" ] && command -v npm &> /dev/null; then
        log_info "프론트엔드 테스트 실행 중..."
        npm test -- --testPathPattern="standardization" || {
            log_warn "프론트엔드 표준화 테스트를 찾을 수 없습니다."
        }
        log_info "프론트엔드 테스트 완료"
    else
        log_warn "npm을 찾을 수 없거나 package.json이 없습니다."
    fi
}

# 메인 함수
main() {
    local phase="${1:-all}"
    
    log_info "=========================================="
    log_info "표준화 작업 후 테스트 시작"
    log_info "=========================================="
    
    case "$phase" in
        procedure)
            test_procedures
            ;;
        service)
            test_services
            ;;
        api)
            test_api
            ;;
        role)
            test_roles
            ;;
        frontend)
            test_frontend
            ;;
        all)
            test_procedures || log_error "프로시저 테스트 실패"
            test_services || log_error "Service 테스트 실패"
            test_api || log_error "API 테스트 실패"
            test_roles || log_warn "역할 시스템 테스트 스킵"
            test_frontend || log_warn "프론트엔드 테스트 스킵"
            ;;
        *)
            log_error "알 수 없는 phase: $phase"
            echo "사용법: $0 [all|procedure|service|api|role|frontend]"
            exit 1
            ;;
    esac
    
    log_info "=========================================="
    log_info "테스트 완료"
    log_info "=========================================="
}

main "$@"

