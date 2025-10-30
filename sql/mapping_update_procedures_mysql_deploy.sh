#!/bin/bash
# 매핑 수정 프로시저 배포 스크립트
# DELIMITER 문제 해결을 위한 별도 배포 스크립트

DB_USER="${DB_USER:-mindgarden}"
DB_PASS="${DB_PASS:-mindgarden2025}"
DB_NAME="${DB_NAME:-mind_garden}"
SQL_FILE="${1:-/tmp/mapping_update_procedures_mysql.sql}"

echo "🔧 매핑 수정 프로시저 배포 시작..."

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 프로시저 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi

# 프로시저 배포 실행
mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | tee /tmp/procedure_deploy.log

DEPLOY_RESULT=${PIPESTATUS[0]}

if [ $DEPLOY_RESULT -eq 0 ]; then
    echo "✅ 매핑 수정 프로시저 배포 완료"
    
    # 프로시저 확인
    echo "📋 배포된 프로시저 확인:"
    mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        ROUTINE_NAME,
        CREATED,
        LAST_ALTERED,
        CASE 
            WHEN ROUTINE_DEFINITION LIKE '%tax_included%' THEN '✅ 최신버전'
            ELSE '⚠️ 구버전'
        END AS '버전'
    FROM information_schema.ROUTINES 
    WHERE ROUTINE_SCHEMA = '$DB_NAME' 
    AND ROUTINE_TYPE = 'PROCEDURE' 
    AND ROUTINE_NAME = 'UpdateMappingInfo';
    " 2>/dev/null || true
else
    echo "❌ 매핑 수정 프로시저 배포 실패"
    echo "📋 배포 로그:"
    cat /tmp/procedure_deploy.log || true
    exit 1
fi

