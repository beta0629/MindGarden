#!/bin/bash

# 개발 서버 상태 체크 스크립트
# Usage: ./scripts/check-dev-server-health.sh

set -e

SERVER="root@beta0629.cafe24.com"
WARNING_THRESHOLD_DISK=80  # 디스크 사용률 경고 기준 (%)
WARNING_THRESHOLD_CONN=250  # MySQL 연결 수 경고 기준
WARNING_THRESHOLD_MEM=85    # 메모리 사용률 경고 기준 (%)

echo "🔍 개발 서버 상태 체크 시작..."
echo "=========================================="
echo ""

# 1. 디스크 사용량 체크
echo "📦 디스크 사용량 체크"
DISK_USAGE=$(ssh $SERVER "df -h / | awk 'NR==2 {print \$5}' | sed 's/%//'")
if [ -z "$DISK_USAGE" ]; then
    DISK_USAGE=$(ssh $SERVER "df -h /var | awk 'NR==2 {print \$5}' | sed 's/%//'")
fi

if [ "$DISK_USAGE" -ge "$WARNING_THRESHOLD_DISK" ]; then
    echo "  ⚠️  경고: 디스크 사용률 ${DISK_USAGE}% (경고 기준: ${WARNING_THRESHOLD_DISK}%)"
    ssh $SERVER "df -h | grep -E '(Filesystem|/dev/)' | head -5"
else
    echo "  ✅ 디스크 사용률: ${DISK_USAGE}%"
fi
echo ""

# 2. /tmp 디스크 공간 체크
echo "📂 /tmp 디스크 공간 체크"
TMP_USAGE=$(ssh $SERVER "df -h /tmp 2>/dev/null | awk 'NR==2 {print \$5}' | sed 's/%//' || echo '0'")
if [ "$TMP_USAGE" != "0" ] && [ "$TMP_USAGE" -ge "$WARNING_THRESHOLD_DISK" ]; then
    echo "  ⚠️  경고: /tmp 디스크 사용률 ${TMP_USAGE}% (경고 기준: ${WARNING_THRESHOLD_DISK}%)"
else
    if [ "$TMP_USAGE" != "0" ]; then
        echo "  ✅ /tmp 디스크 사용률: ${TMP_USAGE}%"
    else
        echo "  ℹ️  /tmp 마운트 정보 없음"
    fi
fi
echo ""

# 3. MySQL 연결 수 체크
echo "🗄️  MySQL 연결 수 체크"
MYSQL_CONN=$(ssh $SERVER "mysql -u root -Nse \"SHOW STATUS LIKE 'Threads_connected';\" 2>/dev/null | awk '{print \$2}' || echo '0'")
MYSQL_MAX=$(ssh $SERVER "mysql -u root -Nse \"SHOW VARIABLES LIKE 'max_connections';\" 2>/dev/null | awk '{print \$2}' || echo '0'")

if [ "$MYSQL_CONN" != "0" ] && [ "$MYSQL_MAX" != "0" ]; then
    CONN_PERCENT=$((MYSQL_CONN * 100 / MYSQL_MAX))
    if [ "$MYSQL_CONN" -ge "$WARNING_THRESHOLD_CONN" ]; then
        echo "  ⚠️  경고: MySQL 연결 수 ${MYSQL_CONN}/${MYSQL_MAX} (${CONN_PERCENT}%) (경고 기준: ${WARNING_THRESHOLD_CONN})"
        
        # 사용자별 연결 수 확인
        echo "  📊 사용자별 연결 수:"
        ssh $SERVER "mysql -u root -Nse \"SELECT user, COUNT(*) as conn_count FROM information_schema.processlist GROUP BY user;\" 2>/dev/null | while read user count; do echo \"    - \$user: \$count\"; done" || echo "    (확인 불가)"
    else
        echo "  ✅ MySQL 연결 수: ${MYSQL_CONN}/${MYSQL_MAX} (${CONN_PERCENT}%)"
    fi
else
    echo "  ⚠️  MySQL 연결 정보 확인 불가"
fi
echo ""

# 4. 메모리 사용량 체크
echo "💾 메모리 사용량 체크"
MEM_INFO=$(ssh $SERVER "free | awk 'NR==2{printf \"%.0f\", \$3*100/\$2}'")
if [ "$MEM_INFO" -ge "$WARNING_THRESHOLD_MEM" ]; then
    echo "  ⚠️  경고: 메모리 사용률 ${MEM_INFO}% (경고 기준: ${WARNING_THRESHOLD_MEM}%)"
    ssh $SERVER "free -h | head -2"
else
    echo "  ✅ 메모리 사용률: ${MEM_INFO}%"
    ssh $SERVER "free -h | head -2"
fi
echo ""

# 5. 서비스 프로세스 체크
echo "🚀 서비스 프로세스 체크"
JAVA_PROCESSES=$(ssh $SERVER "ps aux | grep java | grep -E '(app.jar|ops)' | grep -v grep | wc -l")
if [ "$JAVA_PROCESSES" -eq "0" ]; then
    echo "  ⚠️  경고: 실행 중인 Java 프로세스가 없습니다"
elif [ "$JAVA_PROCESSES" -gt "3" ]; then
    echo "  ⚠️  경고: Java 프로세스가 ${JAVA_PROCESSES}개 실행 중입니다 (정상: 1-2개)"
    ssh $SERVER "ps aux | grep java | grep -E '(app.jar|ops)' | grep -v grep | awk '{print \$2, \$11, \$12, \$13}'"
else
    echo "  ✅ Java 프로세스: ${JAVA_PROCESSES}개 실행 중"
    ssh $SERVER "ps aux | grep java | grep -E '(app.jar|ops)' | grep -v grep | awk '{print \"    PID:\", \$2, \"CMD:\", \$11, \$12, \$13}'"
fi
echo ""

# 6. 서비스 Health Check
echo "🏥 서비스 Health Check"
HEALTH_CHECK=$(ssh $SERVER "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo 'FAILED'")
if echo "$HEALTH_CHECK" | grep -q "UP\|status.*UP"; then
    echo "  ✅ 서비스 Health Check: 정상"
elif echo "$HEALTH_CHECK" | grep -q "FAILED"; then
    echo "  ⚠️  서비스 Health Check: 실패 (서비스가 실행 중이지 않을 수 있습니다)"
else
    echo "  ⚠️  서비스 Health Check: 응답 없음"
fi
echo ""

# 7. 로그 파일 크기 체크
echo "📝 로그 파일 크기 체크"
LOG_SIZE=$(ssh $SERVER "du -sh /var/www/mindgarden-dev/logs 2>/dev/null | awk '{print \$1}' || echo '0'")
if [ "$LOG_SIZE" != "0" ]; then
    echo "  ℹ️  로그 디렉토리 크기: ${LOG_SIZE}"
    OLD_LOGS=$(ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +7 2>/dev/null | wc -l")
    if [ "$OLD_LOGS" -gt "0" ]; then
        echo "  💡 7일 이상 된 로그 파일: ${OLD_LOGS}개 (정리 권장)"
    fi
else
    echo "  ℹ️  로그 디렉토리 정보 없음"
fi
echo ""

# 8. 디스크 사용량 상세 (큰 디렉토리)
echo "📁 큰 디렉토리 체크 (상위 5개)"
ssh $SERVER "du -sh /var/www/* 2>/dev/null | sort -h | tail -5 | awk '{printf \"  - %s\\n\", \$0}'"
echo ""

# 9. 최근 에러 로그 체크
echo "🔴 최근 에러 로그 체크 (마지막 10줄)"
RECENT_ERRORS=$(ssh $SERVER "tail -100 /var/www/mindgarden-dev/logs/ops-backend.log 2>/dev/null | grep -i 'error\|exception\|failed' | tail -5 || echo '로그 파일 없음'")
if echo "$RECENT_ERRORS" | grep -q "로그 파일 없음"; then
    echo "  ℹ️  ${RECENT_ERRORS}"
else
    if [ -n "$RECENT_ERRORS" ]; then
        echo "  ⚠️  최근 에러 로그 발견:"
        echo "$RECENT_ERRORS" | sed 's/^/    /'
    else
        echo "  ✅ 최근 에러 로그 없음"
    fi
fi
echo ""

echo "=========================================="
echo "✅ 개발 서버 상태 체크 완료"
echo ""
echo "💡 권장 조치:"
echo "  - 디스크 사용률이 80% 이상이면 로그 파일 정리"
echo "  - MySQL 연결 수가 250 이상이면 연결 풀 설정 확인"
echo "  - 메모리 사용률이 85% 이상이면 서비스 재시작 고려"
echo ""

