#!/bin/bash

# MySQL 데이터베이스 연결 정리 스크립트
# "Too many connections" 오류 해결용

echo "🔧 MySQL 데이터베이스 연결 정리"
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
echo "📊 현재 연결 상태:"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null
SELECT 
    COUNT(*) as total_connections,
    COUNT(CASE WHEN command != 'Sleep' THEN 1 END) as active_connections,
    COUNT(CASE WHEN command = 'Sleep' THEN 1 END) as idle_connections
FROM information_schema.processlist;

SHOW VARIABLES LIKE 'max_connections';
EOF

echo ""
echo "🔍 오래된 연결 확인 (60초 이상 유휴 상태):"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null
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
WHERE command = 'Sleep' AND time > 60
ORDER BY time DESC;
EOF

echo ""
# 자동 실행 모드 확인 (환경 변수 또는 파이프 입력)
if [ "${AUTO_CLEANUP:-false}" = "true" ] || [ -t 0 ]; then
  read -p "⚠️ 오래된 연결을 정리하시겠습니까? (y/N): " -n 1 -r
  echo
  AUTO_YES=false
else
  # 파이프 입력이 있으면 자동으로 yes
  AUTO_YES=true
fi

if [[ "$AUTO_YES" = "true" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 오래된 연결 정리 중..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null
-- 60초 이상 유휴 상태인 연결 정리
SET @kill_ids = (
    SELECT GROUP_CONCAT(id SEPARATOR ', ')
    FROM information_schema.processlist
    WHERE command = 'Sleep' AND time > 60 AND user = '$DB_USERNAME'
);

SET @sql = IF(@kill_ids IS NOT NULL, CONCAT('KILL ', @kill_ids), 'SELECT "No connections to kill"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT "✅ 오래된 연결 정리 완료" as result;
EOF
    echo ""
    echo "✅ 연결 정리 완료"
else
    echo "❌ 연결 정리 취소"
fi

echo ""
echo "📊 정리 후 연결 상태:"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null
SELECT 
    COUNT(*) as total_connections,
    COUNT(CASE WHEN command != 'Sleep' THEN 1 END) as active_connections,
    COUNT(CASE WHEN command = 'Sleep' THEN 1 END) as idle_connections
FROM information_schema.processlist;
EOF

echo ""
echo "💡 추가 권장 사항:"
echo "  1. max_connections가 151 이하인 경우:"
echo "     mysql -u root -p"
echo "     SET GLOBAL max_connections = 200;"
echo ""
echo "  2. 실행 중인 애플리케이션 인스턴스 확인:"
echo "     ps aux | grep java | grep mindgarden"
echo "     systemctl status mindgarden-dev"

