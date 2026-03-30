#!/bin/bash
# 서버 및 DB 상태 종합 확인 스크립트

echo "=========================================="
echo "📋 서버 및 DB 상태 종합 확인"
echo "=========================================="
echo ""

# 서버에 SSH로 접속하여 확인
echo "서버 상태 확인 중..."
ssh root@beta0629.cafe24.com << 'EOF'
    echo "=========================================="
    echo "1. 서비스 상태"
    echo "=========================================="
    systemctl status mindgarden-dev.service --no-pager | head -30 || echo "⚠️ 서비스 상태 확인 실패"
    echo ""
    
    echo "=========================================="
    echo "2. 최근 서비스 로그 (DB 관련)"
    echo "=========================================="
    journalctl -u mindgarden-dev.service --no-pager -n 100 | grep -iE "(database|db|connection|datasource|jdbc|mysql|flyway|migration|error|exception|failed)" | tail -30 || echo "관련 로그 없음"
    echo ""
    
    echo "=========================================="
    echo "3. 포트 8080 리스닝 확인"
    echo "=========================================="
    netstat -tlnp | grep 8080 || ss -tlnp | grep 8080 || echo "⚠️ 포트 8080이 리스닝 중이 아닙니다"
    echo ""
    
    echo "=========================================="
    echo "4. Java 프로세스 확인"
    echo "=========================================="
    ps aux | grep java | grep -v grep || echo "⚠️ Java 프로세스가 실행 중이 아닙니다"
    echo ""
    
    echo "=========================================="
    echo "5. DB 연결 테스트 (환경 변수 확인)"
    echo "=========================================="
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
        echo "DB_HOST: ${DB_HOST:-없음}"
        echo "DB_NAME: ${DB_NAME:-없음}"
        echo "DB_USERNAME: ${DB_USERNAME:-없음}"
        echo ""
        
        if command -v mysql &> /dev/null; then
            echo "MySQL 클라이언트로 연결 테스트..."
            timeout 5 mysql -h "${DB_HOST}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT 1 as connection_test;" "${DB_NAME}" 2>&1 | head -5 || echo "⚠️ DB 연결 실패"
        else
            echo "⚠️ MySQL 클라이언트가 설치되어 있지 않습니다"
        fi
    else
        echo "⚠️ 환경 변수 파일 없음: /etc/mindgarden/dev.env"
    fi
    echo ""
    
    echo "=========================================="
    echo "6. 애플리케이션 로그 파일 확인"
    echo "=========================================="
    if [ -f /var/log/mindgarden/dev-error.log ]; then
        echo "최근 에러 로그 (최근 30줄):"
        tail -30 /var/log/mindgarden/dev-error.log | grep -iE "(database|db|connection|error|exception)" || echo "DB 관련 에러 없음"
    else
        echo "⚠️ 에러 로그 파일 없음"
    fi
    echo ""
    
    echo "=========================================="
    echo "7. Flyway 마이그레이션 상태"
    echo "=========================================="
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
        if command -v mysql &> /dev/null; then
            mysql -h "${DB_HOST}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;" 2>/dev/null || echo "⚠️ Flyway 테이블 조회 실패"
        fi
    fi
    echo ""
    
    echo "=========================================="
    echo "✅ 확인 완료"
    echo "=========================================="
EOF

echo ""
echo "=========================================="
echo "📝 다음 단계"
echo "=========================================="
echo "서버가 실행 중이 아니면:"
echo "  sudo systemctl start mindgarden-dev.service"
echo ""
echo "서버 재시작:"
echo "  sudo systemctl restart mindgarden-dev.service"
echo ""

