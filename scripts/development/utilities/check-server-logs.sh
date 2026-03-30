#!/bin/bash
# 개발 서버 로그 확인 스크립트
# Flyway 마이그레이션 오류 및 애플리케이션 시작 오류 확인

set -e

echo "🔍 개발 서버 로그 확인 시작..."
echo ""

# 서비스 상태 확인
echo "=========================================="
echo "📋 서비스 상태:"
echo "=========================================="
sudo systemctl status mindgarden-dev.service --no-pager -l | head -30 || echo "⚠️ 서비스 상태 확인 실패"
echo ""

# 최근 서비스 로그 (최근 200줄)
echo "=========================================="
echo "📋 최근 서비스 로그 (최근 200줄):"
echo "=========================================="
sudo journalctl -u mindgarden-dev.service --no-pager -n 200 || echo "⚠️ 로그 확인 실패"
echo ""

# Flyway 관련 오류만 필터링
echo "=========================================="
echo "📋 Flyway 관련 오류:"
echo "=========================================="
sudo journalctl -u mindgarden-dev.service --no-pager -n 500 | grep -i -E "(flyway|migration|V42|CreateOrActivateTenant|DELIMITER|SQL.*error|syntax.*error)" || echo "⚠️ Flyway 관련 오류 없음 (또는 다른 오류)"
echo ""

# 애플리케이션 에러 로그 파일 확인
echo "=========================================="
echo "📋 애플리케이션 에러 로그 파일:"
echo "=========================================="
if [ -f /var/log/mindgarden/dev-error.log ]; then
    sudo tail -100 /var/log/mindgarden/dev-error.log
elif [ -f /var/www/mindgarden-dev/logs/error.log ]; then
    sudo tail -100 /var/www/mindgarden-dev/logs/error.log
else
    echo "⚠️ 에러 로그 파일을 찾을 수 없습니다."
fi
echo ""

# Flyway 마이그레이션 상태 확인 (DB 접속 가능한 경우)
echo "=========================================="
echo "📋 Flyway 마이그레이션 상태 (DB):"
echo "=========================================="
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
    mysql -h"${DB_HOST:-localhost}" -u"${DB_USERNAME:-mindgarden_dev}" -p"${DB_PASSWORD}" "${DB_NAME:-core_solution}" -e "
        SELECT version, description, type, installed_on, success, execution_time
        FROM flyway_schema_history 
        WHERE version = '42' OR version LIKE '4%'
        ORDER BY installed_rank DESC
        LIMIT 10;
    " 2>/dev/null || echo "⚠️ DB 접속 실패 또는 V42 마이그레이션 없음"
else
    echo "⚠️ 환경 변수 파일을 찾을 수 없습니다."
fi
echo ""

# 프로시저 존재 여부 확인
echo "=========================================="
echo "📋 CreateOrActivateTenant 프로시저 확인:"
echo "=========================================="
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
    mysql -h"${DB_HOST:-localhost}" -u"${DB_USERNAME:-mindgarden_dev}" -p"${DB_PASSWORD}" "${DB_NAME:-core_solution}" -e "
        SHOW PROCEDURE STATUS WHERE Db = '${DB_NAME:-core_solution}' AND Name = 'CreateOrActivateTenant';
    " 2>/dev/null || echo "⚠️ DB 접속 실패"
else
    echo "⚠️ 환경 변수 파일을 찾을 수 없습니다."
fi
echo ""

echo "✅ 로그 확인 완료"
echo ""
echo "💡 다음 단계:"
echo "   1. 위의 Flyway 관련 오류 메시지를 확인하세요"
echo "   2. V42 마이그레이션이 success=0인지 확인하세요"
echo "   3. CreateOrActivateTenant 프로시저가 존재하는지 확인하세요"

