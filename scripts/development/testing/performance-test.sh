#!/bin/bash

# 성능 모니터링 테스트 스크립트
# 사용법: ./scripts/development/testing/performance-test.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${PURPLE}"
echo "=========================================="
echo "  📊 성능 모니터링 테스트"
echo "=========================================="
echo -e "${NC}"

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../.."
PROJECT_ROOT=$(pwd)

echo -e "${CYAN}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p logs/performance-test
PERFORMANCE_LOG="logs/performance-test/performance-$(date "+%Y%m%d-%H%M%S").log"

echo -e "${CYAN}📝 성능 로그: ${PERFORMANCE_LOG}${NC}"
echo ""

# 로그 파일 초기화
cat > "$PERFORMANCE_LOG" << EOF
========================================
성능 모니터링 테스트 로그
========================================
시작 시간: $(date "+%Y-%m-%d %H:%M:%S")
프로젝트: CoreSolution
브랜치: $(git branch --show-current)
커밋: $(git log --oneline -1)
========================================

EOF

# DB 연결 정보
DB_HOST="114.202.247.246"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

# ===============================================
# 1단계: 인덱스 사용률 확인
# ===============================================
echo -e "${YELLOW}📊 1단계: 인덱스 사용률 확인${NC}"
echo "1단계: 인덱스 사용률 확인" >> "$PERFORMANCE_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$PERFORMANCE_LOG"

# 주요 테이블별 인덱스 확인
TABLES=("users" "consultants" "clients" "schedules" "consultation_records")

for TABLE in "${TABLES[@]}"; do
    echo -e "${BLUE}   📋 ${TABLE} 테이블 인덱스 확인...${NC}"
    echo "테이블: ${TABLE}" >> "$PERFORMANCE_LOG"
    
    # EXPLAIN 쿼리 실행
    EXPLAIN_RESULT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "EXPLAIN SELECT * FROM ${TABLE} WHERE tenant_id = 'tenant-unknown-consultation-001' LIMIT 1;" 2>/dev/null | tail -n +2)
    
    if [[ $EXPLAIN_RESULT == *"idx_"* ]]; then
        echo -e "${GREEN}   ✅ 인덱스 사용 중: ${TABLE}${NC}"
        echo "   인덱스 사용: YES" >> "$PERFORMANCE_LOG"
    else
        echo -e "${RED}   ❌ 인덱스 미사용: ${TABLE}${NC}"
        echo "   인덱스 사용: NO" >> "$PERFORMANCE_LOG"
    fi
    
    echo "$EXPLAIN_RESULT" >> "$PERFORMANCE_LOG"
    echo "" >> "$PERFORMANCE_LOG"
done

echo -e "${GREEN}✅ 1단계 완료: 인덱스 사용률 확인${NC}"
echo ""

# ===============================================
# 2단계: 쿼리 성능 측정
# ===============================================
echo -e "${YELLOW}⚡ 2단계: 쿼리 성능 측정${NC}"
echo "2단계: 쿼리 성능 측정" >> "$PERFORMANCE_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$PERFORMANCE_LOG"

# 성능 측정 쿼리들
QUERIES=(
    "SELECT COUNT(*) FROM users WHERE tenant_id = 'tenant-unknown-consultation-001'"
    "SELECT * FROM users WHERE tenant_id = 'tenant-unknown-consultation-001' AND is_deleted = false LIMIT 10"
    "SELECT COUNT(*) FROM schedules WHERE tenant_id = 'tenant-unknown-consultation-001'"
    "SELECT * FROM schedules WHERE tenant_id = 'tenant-unknown-consultation-001' AND created_at > '2024-01-01' LIMIT 5"
)

QUERY_NAMES=(
    "사용자 수 조회"
    "사용자 목록 조회"
    "일정 수 조회"
    "일정 목록 조회"
)

TOTAL_TIME=0
QUERY_COUNT=0

for i in "${!QUERIES[@]}"; do
    QUERY="${QUERIES[$i]}"
    QUERY_NAME="${QUERY_NAMES[$i]}"
    
    echo -e "${BLUE}   🔍 ${QUERY_NAME}...${NC}"
    echo "쿼리: ${QUERY_NAME}" >> "$PERFORMANCE_LOG"
    echo "SQL: ${QUERY}" >> "$PERFORMANCE_LOG"
    
    # 쿼리 실행 시간 측정 (3회 평균)
    TIMES=()
    for j in {1..3}; do
        START_TIME=$(date +%s.%N)
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$QUERY" > /dev/null 2>&1
        END_TIME=$(date +%s.%N)
        EXECUTION_TIME=$(echo "$END_TIME - $START_TIME" | bc -l)
        TIMES+=($EXECUTION_TIME)
    done
    
    # 평균 계산
    AVG_TIME=$(echo "scale=4; (${TIMES[0]} + ${TIMES[1]} + ${TIMES[2]}) / 3" | bc -l)
    TOTAL_TIME=$(echo "scale=4; $TOTAL_TIME + $AVG_TIME" | bc -l)
    QUERY_COUNT=$((QUERY_COUNT + 1))
    
    # 결과 출력
    if (( $(echo "$AVG_TIME < 0.1" | bc -l) )); then
        echo -e "${GREEN}   ✅ ${QUERY_NAME}: ${AVG_TIME}초 (우수)${NC}"
        echo "   실행 시간: ${AVG_TIME}초 (우수)" >> "$PERFORMANCE_LOG"
    elif (( $(echo "$AVG_TIME < 0.5" | bc -l) )); then
        echo -e "${YELLOW}   ⚠️  ${QUERY_NAME}: ${AVG_TIME}초 (보통)${NC}"
        echo "   실행 시간: ${AVG_TIME}초 (보통)" >> "$PERFORMANCE_LOG"
    else
        echo -e "${RED}   ❌ ${QUERY_NAME}: ${AVG_TIME}초 (느림)${NC}"
        echo "   실행 시간: ${AVG_TIME}초 (느림)" >> "$PERFORMANCE_LOG"
    fi
    
    echo "   개별 시간: ${TIMES[0]}초, ${TIMES[1]}초, ${TIMES[2]}초" >> "$PERFORMANCE_LOG"
    echo "" >> "$PERFORMANCE_LOG"
done

# 전체 평균 계산
AVG_TOTAL_TIME=$(echo "scale=4; $TOTAL_TIME / $QUERY_COUNT" | bc -l)

echo -e "${GREEN}✅ 2단계 완료: 쿼리 성능 측정${NC}"
echo ""

# ===============================================
# 3단계: 데이터베이스 상태 확인
# ===============================================
echo -e "${YELLOW}🗄️ 3단계: 데이터베이스 상태 확인${NC}"
echo "3단계: 데이터베이스 상태 확인" >> "$PERFORMANCE_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$PERFORMANCE_LOG"

# 테이블별 레코드 수 확인
echo -e "${BLUE}   📊 테이블별 레코드 수...${NC}"
echo "테이블별 레코드 수:" >> "$PERFORMANCE_LOG"

for TABLE in "${TABLES[@]}"; do
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE $TABLE" > /dev/null 2>&1; then
        COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM $TABLE" 2>/dev/null | tail -n 1)
        TENANT_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM $TABLE WHERE tenant_id = 'tenant-unknown-consultation-001'" 2>/dev/null | tail -n 1)
        
        echo -e "${CYAN}   📋 ${TABLE}: 전체 ${COUNT}개, 테넌트 ${TENANT_COUNT}개${NC}"
        echo "   ${TABLE}: 전체 ${COUNT}개, 테넌트 ${TENANT_COUNT}개" >> "$PERFORMANCE_LOG"
    else
        echo -e "${YELLOW}   ⚠️  ${TABLE}: 테이블 없음${NC}"
        echo "   ${TABLE}: 테이블 없음" >> "$PERFORMANCE_LOG"
    fi
done

echo -e "${GREEN}✅ 3단계 완료: 데이터베이스 상태 확인${NC}"
echo ""

# ===============================================
# 4단계: 성능 결과 요약
# ===============================================
echo -e "${YELLOW}📊 4단계: 성능 결과 요약${NC}"
echo "4단계: 성능 결과 요약" >> "$PERFORMANCE_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$PERFORMANCE_LOG"

TEST_END_TIME=$(date "+%Y-%m-%d %H:%M:%S")

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  📊 성능 테스트 결과 요약${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}테스트 시간:${NC} $(date "+%Y-%m-%d %H:%M:%S")"
echo -e "${BLUE}총 쿼리 수:${NC} $QUERY_COUNT"
echo -e "${BLUE}평균 실행 시간:${NC} ${AVG_TOTAL_TIME}초"
echo ""

# 성능 등급 판정
if (( $(echo "$AVG_TOTAL_TIME < 0.05" | bc -l) )); then
    echo -e "${GREEN}🏆 성능 등급: 우수 (0.05초 미만)${NC}"
    PERFORMANCE_GRADE="우수"
elif (( $(echo "$AVG_TOTAL_TIME < 0.1" | bc -l) )); then
    echo -e "${GREEN}✅ 성능 등급: 양호 (0.1초 미만)${NC}"
    PERFORMANCE_GRADE="양호"
elif (( $(echo "$AVG_TOTAL_TIME < 0.5" | bc -l) )); then
    echo -e "${YELLOW}⚠️  성능 등급: 보통 (0.5초 미만)${NC}"
    PERFORMANCE_GRADE="보통"
else
    echo -e "${RED}❌ 성능 등급: 개선 필요 (0.5초 이상)${NC}"
    PERFORMANCE_GRADE="개선 필요"
fi

echo ""

# 로그에 기록
cat >> "$PERFORMANCE_LOG" << EOF

========================================
성능 테스트 결과 요약
========================================
종료 시간: $TEST_END_TIME
총 쿼리 수: $QUERY_COUNT
평균 실행 시간: ${AVG_TOTAL_TIME}초
성능 등급: $PERFORMANCE_GRADE
========================================

EOF

echo -e "${CYAN}권장 사항:${NC}"
if (( $(echo "$AVG_TOTAL_TIME < 0.1" | bc -l) )); then
    echo -e "${GREEN}   ✅ 현재 성능이 우수합니다!${NC}"
    echo -e "${BLUE}   💡 정기적인 모니터링을 권장합니다.${NC}"
else
    echo -e "${YELLOW}   📈 성능 개선 방안:${NC}"
    echo -e "${BLUE}   1. 복합 인덱스 최적화${NC}"
    echo -e "${BLUE}   2. 쿼리 튜닝${NC}"
    echo -e "${BLUE}   3. 데이터베이스 캐싱${NC}"
fi

echo ""
echo -e "${CYAN}상세 로그:${NC} $PERFORMANCE_LOG"
echo ""

if (( $(echo "$AVG_TOTAL_TIME < 0.1" | bc -l) )); then
    echo -e "${GREEN}🎉 성능 테스트 완료! (우수한 성능)${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  성능 테스트 완료 (개선 권장)${NC}"
    exit 0
fi
