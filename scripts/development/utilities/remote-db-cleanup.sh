#!/bin/bash

# 원격 서버에서 DB 연결 정리 스크립트 실행
# 로컬에서 실행하여 서버의 스크립트를 원격으로 실행

set -e

DEV_SERVER="beta0629.cafe24.com"
DEV_USER="root"
SCRIPT_PATH="/opt/mindgarden/scripts/development/utilities/emergency-kill-connections.sh"

echo "🚨 원격 서버 DB 연결 정리"
echo "=================================="
echo "서버: $DEV_USER@$DEV_SERVER"
echo ""

# SSH로 서버에 접속하여 스크립트 실행
ssh -o StrictHostKeyChecking=no "$DEV_USER@$DEV_SERVER" << 'REMOTE_SCRIPT'
  echo "🔍 서버 접속 성공"
  
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
  echo "📊 정리 전 연결 상태:"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null || true
  SELECT 
      COUNT(*) as total_connections,
      COUNT(CASE WHEN command != 'Sleep' THEN 1 END) as active_connections,
      COUNT(CASE WHEN command = 'Sleep' THEN 1 END) as idle_connections
  FROM information_schema.processlist;
  
  SHOW VARIABLES LIKE 'max_connections';
  EOF
  
  echo ""
  echo "🔍 현재 연결 상세 정보 (상위 20개):"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null || true
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
  WHERE user = '$DB_USERNAME'
  ORDER BY time DESC
  LIMIT 20;
  EOF
  
  echo ""
  echo "🧹 모든 유휴 연결 정리 중..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null || true
  SET @kill_ids = (
      SELECT GROUP_CONCAT(id SEPARATOR ', ')
      FROM information_schema.processlist
      WHERE command = 'Sleep' AND user = '$DB_USERNAME'
  );
  
  SET @sql = IF(@kill_ids IS NOT NULL AND @kill_ids != '', 
      CONCAT('KILL ', @kill_ids), 
      'SELECT "No idle connections to kill" as result');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SELECT "✅ 유휴 연결 정리 완료" as result;
  EOF
  
  echo ""
  echo "📊 정리 후 연결 상태:"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" <<EOF 2>/dev/null || true
  SELECT 
      COUNT(*) as total_connections,
      COUNT(CASE WHEN command != 'Sleep' THEN 1 END) as active_connections,
      COUNT(CASE WHEN command = 'Sleep' THEN 1 END) as idle_connections
  FROM information_schema.processlist;
  EOF
  
  echo ""
  echo "🔍 실행 중인 애플리케이션 프로세스:"
  ps aux | grep java | grep mindgarden || echo "실행 중인 프로세스 없음"
  
  echo ""
  echo "📊 서비스 상태:"
  systemctl status mindgarden-dev.service --no-pager | head -15 || true
  
  echo ""
  echo "✅ 원격 연결 정리 완료"
REMOTE_SCRIPT

echo ""
echo "✅ 원격 서버 작업 완료"

