#!/bin/bash
# DB 연결 상태 확인 스크립트

echo "=========================================="
echo "📋 DB 연결 상태 확인"
echo "=========================================="
echo ""

# 서버 URL
BASE_URL="${BASE_URL:-http://beta0629.cafe24.com:8080}"

# 1. 서버 헬스체크
echo "1. 서버 헬스체크..."
SERVER_HEALTH=$(curl -s "${BASE_URL}/api/health/server" 2>/dev/null)
if [ -n "$SERVER_HEALTH" ]; then
    echo "$SERVER_HEALTH" | jq '.' 2>/dev/null || echo "$SERVER_HEALTH"
else
    echo "❌ 서버 응답 없음"
    echo "서버가 실행 중인지 확인하세요."
    exit 1
fi
echo ""

# 2. DB 연결 헬스체크
echo "2. DB 연결 헬스체크..."
DB_HEALTH=$(curl -s "${BASE_URL}/api/health/database" 2>/dev/null)
if [ -n "$DB_HEALTH" ]; then
    echo "$DB_HEALTH" | jq '.' 2>/dev/null || echo "$DB_HEALTH"
    
    # 상태 확인
    if echo "$DB_HEALTH" | grep -q '"status":"healthy"'; then
        echo "✅ DB 연결 정상"
    else
        echo "❌ DB 연결 실패"
        echo ""
        echo "가능한 원인:"
        echo "  1. DB 서버가 실행 중이 아님"
        echo "  2. DB 연결 정보가 잘못됨"
        echo "  3. 방화벽 설정 문제"
        echo "  4. DB 사용자 권한 문제"
    fi
else
    echo "❌ DB 헬스체크 응답 없음"
fi
echo ""

# 3. 서버 로그에서 DB 연결 오류 확인 (SSH 가능한 경우)
if [ -n "$SSH_HOST" ]; then
    echo "3. 서버 로그에서 DB 연결 오류 확인..."
    ssh "$SSH_HOST" << 'EOF'
        echo "=== 최근 DB 연결 오류 로그 ==="
        journalctl -u mindgarden-dev -n 200 --no-pager | grep -iE "(database|db|connection|datasource|jdbc|mysql|connection.*fail|cannot.*connect)" | tail -20 || echo "DB 관련 오류 로그 없음"
        echo ""
        echo "=== Flyway 마이그레이션 오류 ==="
        journalctl -u mindgarden-dev -n 200 --no-pager | grep -iE "(flyway|migration.*fail|migration.*error)" | tail -10 || echo "Flyway 오류 없음"
EOF
else
    echo "3. SSH 정보가 없어 로그 확인 건너뜀"
    echo "   SSH_HOST 환경 변수를 설정하면 로그를 확인할 수 있습니다."
fi
echo ""

echo "=========================================="
echo "✅ 확인 완료"
echo "=========================================="

