#!/bin/bash
# 운영 환경 프로시저 안전 배포 스크립트
# 기존 프로시저 백업 → 배포 → 검증 → 롤백 준비

set -e

# 운영 환경 설정
PROD_DB_HOST="${PROD_DB_HOST:-beta74.cafe24.com}"
PROD_DB_USER="${PROD_DB_USER:-mindgarden_prod}"
PROD_DB_PASS="${PROD_DB_PASSWORD}"
PROD_DB_NAME="${PROD_DB_NAME:-core_solution}"
BACKUP_DIR="/tmp/procedure_backup_$(date +%Y%m%d_%H%M%S)"
PROCEDURES_DEPLOY_DIR="database/schema/procedures_standardized/deployment"

if [ -z "$PROD_DB_PASS" ]; then
    echo "❌ 오류: 운영 환경 DB 비밀번호가 설정되지 않았습니다."
    echo "   환경 변수 PROD_DB_PASSWORD를 설정하세요."
    exit 1
fi

echo "🚀 운영 환경 프로시저 안전 배포 시작..."
echo "📍 DB: $PROD_DB_HOST / $PROD_DB_NAME"
echo ""

# 배포할 프로시저 목록
PROCEDURES=(
    "CheckTimeConflict"
    "GetRefundableSessions"
    "GetRefundStatistics"
    "ValidateIntegratedAmount"
    "GetConsolidatedFinancialData"
    "ProcessIntegratedSalaryCalculation"
    "GetIntegratedSalaryStatistics"
    "ProcessDiscountAccounting"
    "UpdateDailyStatistics"
    "UpdateConsultantPerformance"
)

# 1단계: 기존 프로시저 백업
echo "💾 1단계: 기존 프로시저 백업 중..."
mkdir -p "$BACKUP_DIR"

for proc in "${PROCEDURES[@]}"; do
    echo "  백업 중: $proc"
    mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" \
        -e "SHOW CREATE PROCEDURE $proc\G" > "$BACKUP_DIR/${proc}_backup.sql" 2>&1 || {
        echo "  ⚠️  $proc 프로시저가 존재하지 않습니다 (신규 배포)"
    }
done

echo "✅ 백업 완료: $BACKUP_DIR"
echo ""

# 2단계: 배포용 파일 확인
echo "📦 2단계: 배포용 프로시저 파일 확인 중..."
if [ ! -d "$PROCEDURES_DEPLOY_DIR" ]; then
    echo "❌ 배포용 파일 디렉토리를 찾을 수 없습니다: $PROCEDURES_DEPLOY_DIR"
    exit 1
fi

# 3단계: 프로시저 배포 (단계별)
echo "📥 3단계: 프로시저 배포 중..."
FAILED_PROCEDURES=()

for proc in "${PROCEDURES[@]}"; do
    file="${PROCEDURES_DEPLOY_DIR}/${proc}_deploy.sql"
    
    if [ ! -f "$file" ]; then
        echo "  ⚠️  파일을 찾을 수 없습니다: $file"
        FAILED_PROCEDURES+=("$proc")
        continue
    fi
    
    echo "  배포 중: $proc"
    
    # 배포 실행
    if mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" < "$file" 2>&1 | grep -v "Warning: Using a password"; then
        # 배포 성공 확인
        PARAM_COUNT=$(mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" \
            -e "SELECT COUNT(*) FROM information_schema.PARAMETERS 
                WHERE SPECIFIC_SCHEMA = '$PROD_DB_NAME' 
                AND SPECIFIC_NAME = '$proc' 
                AND PARAMETER_MODE = 'IN';" 2>&1 | grep -v "Warning\|COUNT" | tail -1)
        
        if [ "$PARAM_COUNT" -gt 0 ]; then
            echo "  ✅ $proc 배포 완료 (파라미터: $PARAM_COUNT개)"
        else
            echo "  ⚠️  $proc 배포되었지만 파라미터 확인 실패"
        fi
    else
        echo "  ❌ $proc 배포 실패"
        FAILED_PROCEDURES+=("$proc")
    fi
done

echo ""

# 4단계: 배포 결과 요약
if [ ${#FAILED_PROCEDURES[@]} -eq 0 ]; then
    echo "✅ 모든 프로시저 배포 완료!"
    echo ""
    echo "📋 배포된 프로시저 확인:"
    mysql -h "$PROD_DB_HOST" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" \
        -e "SELECT ROUTINE_NAME, CREATED, LAST_ALTERED 
            FROM information_schema.ROUTINES 
            WHERE ROUTINE_SCHEMA = '$PROD_DB_NAME' 
            AND ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_NAME IN ($(printf "'%s'," "${PROCEDURES[@]}" | sed 's/,$//'))
            ORDER BY ROUTINE_NAME;" 2>&1 | grep -v "Warning"
else
    echo "❌ 일부 프로시저 배포 실패:"
    printf "  - %s\n" "${FAILED_PROCEDURES[@]}"
    echo ""
    echo "💾 백업 위치: $BACKUP_DIR"
    echo "🔄 롤백 방법:"
    echo "   mysql -h $PROD_DB_HOST -u $PROD_DB_USER -p $PROD_DB_NAME < $BACKUP_DIR/{프로시저명}_backup.sql"
    exit 1
fi

echo ""
echo "✅ 운영 환경 프로시저 배포 완료!"
echo "💾 백업 위치: $BACKUP_DIR"

