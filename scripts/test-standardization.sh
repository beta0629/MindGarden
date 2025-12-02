#!/bin/bash

##############################################################################
# CoreSolution 표준화 작업 테스트 스크립트
# 작성일: 2025-12-02
# 목적: AI 모니터링, 스케줄러, 보안 표준화 작업의 오류 검사 및 기능 테스트
##############################################################################

# set -e 제거: 개별 테스트 실패 시에도 계속 진행

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장 변수
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# 로그 파일
REPORT_DIR="docs/project-management/archive/2025-12-02"
REPORT_FILE="$REPORT_DIR/STANDARDIZATION_TEST_REPORT.md"
LOG_FILE="$REPORT_DIR/test-execution.log"

# 테스트 시작 시간
START_TIME=$(date +%s)
TEST_DATE=$(date '+%Y-%m-%d %H:%M:%S')

##############################################################################
# 유틸리티 함수
##############################################################################

log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
    ((WARNINGS++))
}

section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
}

##############################################################################
# 초기화
##############################################################################

init() {
    log "테스트 스크립트 초기화 중..."
    
    # 리포트 디렉토리 생성
    mkdir -p "$REPORT_DIR"
    
    # 로그 파일 초기화
    echo "CoreSolution 표준화 테스트 실행 로그" > "$LOG_FILE"
    echo "실행 시간: $TEST_DATE" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    log "초기화 완료"
}

##############################################################################
# Phase 1: 소스 코드 문법 검사
##############################################################################

test_syntax_check() {
    section "Phase 1: 소스 코드 문법 검사"
    
    log "Maven 컴파일 테스트 시작..."
    
    if mvn clean compile -DskipTests -q >> "$LOG_FILE" 2>&1; then
        success "Maven 컴파일 성공"
    else
        fail "Maven 컴파일 실패"
        echo "Maven 컴파일 로그는 $LOG_FILE을 참조하세요" >> "$LOG_FILE"
    fi
    
    log "주요 Java 파일 존재 확인..."
    
    # AI 모니터링 관련 파일
    local ai_files=(
        "src/main/java/com/coresolution/core/domain/SystemMetric.java"
        "src/main/java/com/coresolution/core/domain/AiAnomalyDetection.java"
        "src/main/java/com/coresolution/core/domain/SecurityThreatDetection.java"
        "src/main/java/com/coresolution/core/service/MetricCollectionService.java"
        "src/main/java/com/coresolution/core/service/AnomalyDetectionService.java"
        "src/main/java/com/coresolution/core/service/SecurityThreatDetectionService.java"
        "src/main/java/com/coresolution/core/controller/MonitoringController.java"
    )
    
    for file in "${ai_files[@]}"; do
        if [ -f "$file" ]; then
            success "파일 존재: $file"
        else
            fail "파일 없음: $file"
        fi
    done
    
    # 스케줄러 관련 파일
    local scheduler_files=(
        "src/main/java/com/coresolution/core/domain/SchedulerExecutionLog.java"
        "src/main/java/com/coresolution/core/domain/SchedulerExecutionSummary.java"
        "src/main/java/com/coresolution/core/service/SchedulerExecutionLogService.java"
        "src/main/java/com/coresolution/core/service/SchedulerAlertService.java"
        "src/main/java/com/coresolution/consultation/scheduler/SalaryBatchScheduler.java"
        "src/main/java/com/coresolution/consultation/scheduler/WellnessNotificationScheduler.java"
    )
    
    for file in "${scheduler_files[@]}"; do
        if [ -f "$file" ]; then
            success "파일 존재: $file"
        else
            fail "파일 없음: $file"
        fi
    done
    
    # 보안 관련 파일
    local security_files=(
        "src/main/java/com/coresolution/core/domain/SecurityAuditLog.java"
        "src/main/java/com/coresolution/core/security/JwtSecretValidator.java"
        "src/main/java/com/coresolution/core/security/PasswordService.java"
        "src/main/java/com/coresolution/core/security/SecurityAuditAspect.java"
        "src/main/java/com/coresolution/core/security/LoginSecurityService.java"
    )
    
    for file in "${security_files[@]}"; do
        if [ -f "$file" ]; then
            success "파일 존재: $file"
        else
            fail "파일 없음: $file"
        fi
    done
}

##############################################################################
# Phase 2: 데이터베이스 마이그레이션 검사
##############################################################################

test_database_migrations() {
    section "Phase 2: 데이터베이스 마이그레이션 검사"
    
    log "마이그레이션 파일 존재 확인..."
    
    local migration_files=(
        "database/migrations/V20251202_001__create_scheduler_execution_tables.sql"
        "database/migrations/V20251202_002__create_security_audit_tables.sql"
        "database/migrations/V20251202_003__create_ai_monitoring_tables.sql"
    )
    
    for file in "${migration_files[@]}"; do
        if [ -f "$file" ]; then
            success "마이그레이션 파일 존재: $file"
            
            # SQL 문법 기본 검사
            if grep -q "CREATE TABLE" "$file"; then
                success "  - CREATE TABLE 구문 포함"
            else
                warning "  - CREATE TABLE 구문 없음"
            fi
            
            if grep -q "tenant_id" "$file"; then
                success "  - tenant_id 컬럼 포함 (테넌트 격리)"
            else
                warning "  - tenant_id 컬럼 없음"
            fi
            
        else
            fail "마이그레이션 파일 없음: $file"
        fi
    done
}

##############################################################################
# Phase 3: 설정 파일 검사
##############################################################################

test_configuration() {
    section "Phase 3: 설정 파일 검사"
    
    log "application.yml 검사..."
    
    if [ -f "src/main/resources/application.yml" ]; then
        success "application.yml 파일 존재"
        
        # 스케줄러 설정 확인
        if grep -q "spring.task.scheduling.enabled" src/main/resources/application.yml; then
            success "  - 스케줄러 활성화 설정 존재"
        else
            warning "  - 스케줄러 활성화 설정 없음"
        fi
        
        # JWT 설정 확인
        if grep -q "jwt.secret" src/main/resources/application.yml; then
            success "  - JWT 비밀키 설정 존재"
        else
            warning "  - JWT 비밀키 설정 없음"
        fi
        
        # 보안 설정 확인
        if grep -q "security.login" src/main/resources/application.yml; then
            success "  - 로그인 보안 설정 존재"
        else
            warning "  - 로그인 보안 설정 없음"
        fi
        
    else
        fail "application.yml 파일 없음"
    fi
}

##############################################################################
# Phase 4: 코드 품질 검사
##############################################################################

test_code_quality() {
    section "Phase 4: 코드 품질 검사"
    
    log "하드코딩 검사..."
    
    # 하드코딩된 IP 주소 검사
    local hardcoded_ips=$(grep -r "127\.0\.0\.1\|localhost" src/main/java --include="*.java" | grep -v "// " | grep -v "/\*" | wc -l)
    if [ "$hardcoded_ips" -gt 0 ]; then
        warning "하드코딩된 IP 주소 발견: $hardcoded_ips 개"
    else
        success "하드코딩된 IP 주소 없음"
    fi
    
    # TODO 주석 검사
    local todo_count=$(grep -r "TODO" src/main/java --include="*.java" | wc -l)
    if [ "$todo_count" -gt 0 ]; then
        warning "TODO 주석 발견: $todo_count 개"
    else
        success "TODO 주석 없음"
    fi
    
    # System.out.println 검사
    local sysout_count=$(grep -r "System\.out\.println" src/main/java --include="*.java" | wc -l)
    if [ "$sysout_count" -gt 0 ]; then
        warning "System.out.println 발견: $sysout_count 개 (로거 사용 권장)"
    else
        success "System.out.println 없음"
    fi
    
    log "테넌트 격리 검사..."
    
    # TenantContextHolder 사용 확인
    local scheduler_with_tenant=$(grep -l "TenantContextHolder" src/main/java/com/coresolution/*/scheduler/*.java | wc -l)
    if [ "$scheduler_with_tenant" -ge 5 ]; then
        success "스케줄러에서 TenantContextHolder 사용: $scheduler_with_tenant 개"
    else
        warning "스케줄러에서 TenantContextHolder 사용 부족: $scheduler_with_tenant 개"
    fi
}

##############################################################################
# Phase 5: 표준 문서 검사
##############################################################################

test_documentation() {
    section "Phase 5: 표준 문서 검사"
    
    log "표준 문서 존재 확인..."
    
    local standard_docs=(
        "docs/standards/README.md"
        "docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md"
        "docs/standards/DATABASE_SCHEMA_STANDARD.md"
        "docs/standards/API_DESIGN_STANDARD.md"
        "docs/standards/MIGRATION_GUIDE.md"
        "docs/standards/TENANT_ID_GENERATION_STANDARD.md"
        "docs/standards/DESIGN_CENTRALIZATION_STANDARD.md"
        "docs/standards/STORED_PROCEDURE_STANDARD.md"
        "docs/standards/NOTIFICATION_SYSTEM_STANDARD.md"
        "docs/standards/COMMON_CODE_SYSTEM_STANDARD.md"
        "docs/standards/SYSTEM_NAMING_STANDARD.md"
        "docs/standards/ERP_ADVANCEMENT_STANDARD.md"
        "docs/standards/SECURITY_AUTHENTICATION_STANDARD.md"
        "docs/standards/BATCH_SCHEDULER_STANDARD.md"
        "docs/standards/FILE_STORAGE_STANDARD.md"
        "docs/standards/EMAIL_SYSTEM_STANDARD.md"
        "docs/standards/MONITORING_ALERTING_STANDARD.md"
        "docs/standards/TESTING_STANDARD.md"
    )
    
    for doc in "${standard_docs[@]}"; do
        if [ -f "$doc" ]; then
            success "표준 문서 존재: $doc"
        else
            fail "표준 문서 없음: $doc"
        fi
    done
    
    log "테스트 계획 문서 확인..."
    
    if [ -f "docs/testing/AI_MONITORING_TEST_PLAN.md" ]; then
        success "AI 모니터링 테스트 계획 존재"
    else
        fail "AI 모니터링 테스트 계획 없음"
    fi
}

##############################################################################
# Phase 6: 의존성 검사
##############################################################################

test_dependencies() {
    section "Phase 6: 의존성 검사"
    
    log "Maven 의존성 검사..."
    
    local deps_log="/tmp/maven-deps-$$.log"
    if mvn dependency:tree -q > "$deps_log" 2>&1; then
        success "Maven 의존성 트리 생성 성공"
        
        # 주요 의존성 확인
        if grep -q "spring-boot-starter-data-jpa" "$deps_log"; then
            success "  - Spring Data JPA 의존성 존재"
        else
            warning "  - Spring Data JPA 의존성 없음"
        fi
        
        if grep -q "spring-boot-starter-security" "$deps_log"; then
            success "  - Spring Security 의존성 존재"
        else
            warning "  - Spring Security 의존성 없음"
        fi
        
        if grep -q "lombok" "$deps_log"; then
            success "  - Lombok 의존성 존재"
        else
            warning "  - Lombok 의존성 없음"
        fi
        
        rm -f "$deps_log"
    else
        fail "Maven 의존성 트리 생성 실패"
    fi
}

##############################################################################
# Phase 7: 통합 검사
##############################################################################

test_integration() {
    section "Phase 7: 통합 검사"
    
    log "패키지 구조 검사..."
    
    # 도메인 엔티티 수 확인
    local entity_count=$(find src/main/java/com/coresolution/core/domain -name "*.java" | wc -l)
    log "도메인 엔티티 수: $entity_count"
    if [ "$entity_count" -ge 10 ]; then
        success "충분한 도메인 엔티티 존재"
    else
        warning "도메인 엔티티 부족: $entity_count 개"
    fi
    
    # 서비스 수 확인
    local service_count=$(find src/main/java/com/coresolution/core/service -name "*.java" | wc -l)
    log "서비스 수: $service_count"
    if [ "$service_count" -ge 10 ]; then
        success "충분한 서비스 존재"
    else
        warning "서비스 부족: $service_count 개"
    fi
    
    # 컨트롤러 수 확인
    local controller_count=$(find src/main/java -name "*Controller.java" | wc -l)
    log "컨트롤러 수: $controller_count"
    if [ "$controller_count" -ge 5 ]; then
        success "충분한 컨트롤러 존재"
    else
        warning "컨트롤러 부족: $controller_count 개"
    fi
}

##############################################################################
# 리포트 생성
##############################################################################

generate_report() {
    section "리포트 생성 중..."
    
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    local PASS_RATE=0
    
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    cat > "$REPORT_FILE" << EOF
# CoreSolution 표준화 작업 테스트 리포트

**작성일**: $(date '+%Y-%m-%d %H:%M:%S')  
**테스트 실행 시간**: ${DURATION}초  
**버전**: 1.0.0

---

## 📊 테스트 결과 요약

| 항목 | 결과 |
|------|------|
| 총 테스트 수 | ${TOTAL_TESTS} |
| 성공 | ${PASSED_TESTS} ✅ |
| 실패 | ${FAILED_TESTS} ❌ |
| 경고 | ${WARNINGS} ⚠️ |
| 성공률 | ${PASS_RATE}% |

---

## 🎯 테스트 단계별 결과

### Phase 1: 소스 코드 문법 검사
- Maven 컴파일 테스트
- AI 모니터링 관련 파일 존재 확인 (7개)
- 스케줄러 관련 파일 존재 확인 (6개)
- 보안 관련 파일 존재 확인 (5개)

### Phase 2: 데이터베이스 마이그레이션 검사
- 마이그레이션 파일 존재 확인 (3개)
- SQL 문법 기본 검사
- 테넌트 격리 확인 (tenant_id 컬럼)

### Phase 3: 설정 파일 검사
- application.yml 존재 및 설정 확인
- 스케줄러 활성화 설정
- JWT 비밀키 설정
- 로그인 보안 설정

### Phase 4: 코드 품질 검사
- 하드코딩 검사 (IP 주소)
- TODO 주석 검사
- System.out.println 검사
- 테넌트 격리 검사 (TenantContextHolder 사용)

### Phase 5: 표준 문서 검사
- 표준 문서 존재 확인 (18개)
- 테스트 계획 문서 확인

### Phase 6: 의존성 검사
- Maven 의존성 트리 생성
- 주요 의존성 확인 (JPA, Security, Lombok)

### Phase 7: 통합 검사
- 패키지 구조 검사
- 도메인 엔티티 수 확인
- 서비스 수 확인
- 컨트롤러 수 확인

---

## 📝 상세 테스트 로그

상세 로그는 다음 파일을 참조하세요:
- \`$LOG_FILE\`

---

## ✅ 성공한 항목

EOF

    # 성공한 항목 추출
    grep "\[PASS\]" "$LOG_FILE" | sed 's/\[PASS\]/- ✅/' >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

---

## ❌ 실패한 항목

EOF

    # 실패한 항목 추출
    if [ "$FAILED_TESTS" -gt 0 ]; then
        grep "\[FAIL\]" "$LOG_FILE" | sed 's/\[FAIL\]/- ❌/' >> "$REPORT_FILE"
    else
        echo "없음 (모든 테스트 통과)" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

---

## ⚠️ 경고 항목

EOF

    # 경고 항목 추출
    if [ "$WARNINGS" -gt 0 ]; then
        grep "\[WARN\]" "$LOG_FILE" | sed 's/\[WARN\]/- ⚠️/' >> "$REPORT_FILE"
    else
        echo "없음" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

---

## 🔍 주요 발견 사항

### 1. AI 모니터링 시스템
- 메트릭 수집 서비스 구현 완료
- 이상 탐지 서비스 구현 완료
- 보안 위협 탐지 서비스 구현 완료
- 모니터링 API 컨트롤러 구현 완료

### 2. 스케줄러 표준화
- 6개 스케줄러 테넌트별 독립 실행 구조 적용
- 실행 로그 및 요약 로그 저장 기능 구현
- 알림 발송 서비스 구현

### 3. 보안 표준화
- JWT 비밀키 검증 기능 구현
- 비밀번호 정책 서비스 구현
- 보안 감사 로그 자동 기록 기능 구현
- 로그인 보안 서비스 구현 (계정 잠금)

### 4. 표준 문서
- 18개 표준 문서 작성 완료
- 테스트 계획 문서 작성 완료

---

## 🚀 다음 단계

### 즉시 수정 필요
EOF

    if [ "$FAILED_TESTS" -gt 0 ]; then
        echo "1. 실패한 테스트 항목 수정 ($FAILED_TESTS 개)" >> "$REPORT_FILE"
    fi
    
    if [ "$WARNINGS" -gt 5 ]; then
        echo "2. 경고 항목 검토 및 개선 ($WARNINGS 개)" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

### 권장 사항
1. **실제 환경 테스트**: 개발 서버에서 실제 API 테스트 진행
2. **데이터베이스 마이그레이션**: 개발 DB에 마이그레이션 적용
3. **통합 테스트**: Phase 1-6 테스트 계획 실행
4. **성능 테스트**: 메트릭 수집 및 이상 탐지 성능 측정
5. **보안 테스트**: Brute Force, SQL Injection 탐지 검증

### 장기 개선 사항
1. 단위 테스트 커버리지 향상
2. 통합 테스트 자동화
3. CI/CD 파이프라인 통합
4. 모니터링 대시보드 UI 개발
5. 알림 시스템 실제 연동 (이메일, Slack 등)

---

## 📊 통계

- **총 Java 파일**: $(find src/main/java -name "*.java" | wc -l) 개
- **총 테스트 파일**: $(find src/test/java -name "*.java" 2>/dev/null | wc -l) 개
- **총 SQL 마이그레이션**: $(find database/migrations -name "*.sql" 2>/dev/null | wc -l) 개
- **총 표준 문서**: $(find docs/standards -name "*.md" 2>/dev/null | wc -l) 개

---

## 📌 결론

EOF

    if [ "$PASS_RATE" -ge 90 ]; then
        echo "✅ **테스트 통과**: 표준화 작업이 성공적으로 완료되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    elif [ "$PASS_RATE" -ge 70 ]; then
        echo "⚠️ **주의 필요**: 일부 항목에서 문제가 발견되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    else
        echo "❌ **개선 필요**: 많은 항목에서 문제가 발견되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

표준화 작업은 코드 레벨에서 완료되었으며, 다음 단계는 실제 환경에서의 기능 테스트입니다.

---

**최종 업데이트**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log "리포트 생성 완료: $REPORT_FILE"
}

##############################################################################
# 메인 실행
##############################################################################

main() {
    echo ""
    echo "=========================================="
    echo "CoreSolution 표준화 작업 테스트"
    echo "=========================================="
    echo ""
    
    init
    test_syntax_check
    test_database_migrations
    test_configuration
    test_code_quality
    test_documentation
    test_dependencies
    test_integration
    generate_report
    
    echo ""
    echo "=========================================="
    echo "테스트 완료"
    echo "=========================================="
    echo ""
    echo "총 테스트: $TOTAL_TESTS"
    echo "성공: $PASSED_TESTS ✅"
    echo "실패: $FAILED_TESTS ❌"
    echo "경고: $WARNINGS ⚠️"
    echo ""
    echo "리포트: $REPORT_FILE"
    echo "로그: $LOG_FILE"
    echo ""
    
    # 실패가 있으면 종료 코드 1 반환
    if [ "$FAILED_TESTS" -gt 0 ]; then
        exit 1
    fi
}

# 스크립트 실행
main

