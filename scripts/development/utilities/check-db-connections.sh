#!/bin/bash

# MySQL 데이터베이스 연결 상태 확인 스크립트
# "Too many connections" 오류 진단용

echo "🔍 MySQL 데이터베이스 연결 상태 확인"
echo "=================================="

# 환경 변수 로드
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
    echo "✅ 환경 변수 로드 완료"
else
    echo "⚠️ /etc/mindgarden/dev.env 파일을 찾을 수 없습니다."
    exit 1
fi

# MySQL 연결 정보
DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USERNAME="${DB_USERNAME:-mindgarden_dev}"
DB_PASSWORD="${DB_PASSWORD:-MindGardenDev2025!@#}"

echo ""
echo "📊 연결 정보:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo ""

# MySQL 연결 테스트
echo "🔗 MySQL 연결 테스트..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>&1 | head -20
-- 현재 연결 상태 확인
SELECT 
    COUNT(*) as total_connections,
    COUNT(CASE WHEN command != 'Sleep' THEN 1 END) as active_connections,
    COUNT(CASE WHEN command = 'Sleep' THEN 1 END) as idle_connections
FROM information_schema.processlist;

-- max_connections 설정 확인
SHOW VARIABLES LIKE 'max_connections';

-- 현재 연결 상세 정보 (상위 20개)
SELECT 
    id,
    user,
    host,
    db,
    command,
    time,
    state,
    LEFT(info, 50) as query_preview
FROM information_schema.processlist
ORDER BY time DESC
LIMIT 20;

-- 연결 통계
SELECT 
    user,
    COUNT(*) as connection_count
FROM information_schema.processlist
GROUP BY user
ORDER BY connection_count DESC;
EOF

echo ""
echo "✅ 연결 상태 확인 완료"
echo ""
echo "💡 권장 사항:"
echo "  1. max_connections가 151 이하인 경우 증가 필요 (예: SET GLOBAL max_connections = 200;)"
echo "  2. 오래된 연결(시간이 긴 Sleep 연결)이 많은 경우 정리 필요"
echo "  3. 애플리케이션 인스턴스가 여러 개 실행 중인지 확인"

