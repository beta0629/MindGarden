#!/bin/bash
# CreateOrActivateTenant 프로시저 종합 테스트 스크립트

SERVER_HOST="${1:-beta0629.cafe24.com}"
BASE_URL="http://${SERVER_HOST}:8080"

echo "=========================================="
echo "🧪 CreateOrActivateTenant 프로시저 종합 테스트"
echo "=========================================="
echo "서버: $SERVER_HOST"
echo "시간: $(date)"
echo ""

# 1. 헬스체크 - 모든 프로시저 상태 확인
echo "📋 1단계: 프로시저 헬스체크 확인"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/health/procedures" | jq '.' || echo "❌ 헬스체크 실패"
echo ""

# 2. CreateOrActivateTenant 상세 확인
echo "📋 2단계: CreateOrActivateTenant 상세 확인"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/health/procedures/create-or-activate-tenant" | jq '.' || echo "❌ 상세 확인 실패"
echo ""

# 3. 서버에서 직접 프로시저 확인
echo "📋 3단계: 서버에서 프로시저 존재 여부 확인"
echo "----------------------------------------"
ssh root@${SERVER_HOST} << 'EOF'
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
    fi
    
    DB_USER="${DB_USERNAME:-mindgarden_dev}"
    DB_PASS="${DB_PASSWORD}"
    DB_NAME="${DB_NAME:-core_solution}"
    
    if [ -z "$DB_PASS" ]; then
        echo "❌ DB 비밀번호를 찾을 수 없습니다."
        exit 1
    fi
    
    echo "프로시저 존재 여부:"
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SELECT 
            ROUTINE_NAME,
            CREATED,
            LAST_ALTERED,
            CASE 
                WHEN ROUTINE_DEFINITION LIKE '%DECLARE%' AND ROUTINE_DEFINITION LIKE '%BEGIN%' AND ROUTINE_DEFINITION LIKE '%END%' 
                THEN '✅ 구조 정상'
                ELSE '⚠️ 구조 이상'
            END AS '구조 검증'
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = '$DB_NAME' 
        AND ROUTINE_NAME = 'CreateOrActivateTenant' 
        AND ROUTINE_TYPE = 'PROCEDURE';
    " 2>/dev/null || echo "❌ 프로시저 조회 실패"
EOF

echo ""
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="

