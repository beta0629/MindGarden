#!/bin/bash
# 개발 서버 Flyway 체크섬 불일치 해결 스크립트
# 개발 서버 DB에 직접 접속하여 문제 해결

set -e

echo "🔧 개발 서버 Flyway 체크섬 불일치 해결 시작..."
echo ""

# 개발 서버 정보
DEV_SERVER_HOST="${DEV_SERVER_HOST:-114.202.247.246}"
DEV_SERVER_USER="${DEV_SERVER_USER:-root}"
DEV_DB_HOST="${DEV_DB_HOST:-localhost}"
DEV_DB_NAME="${DEV_DB_NAME:-core_solution}"
DEV_DB_USER="${DEV_DB_USER:-mindgarden_dev}"

echo "📋 개발 서버 정보:"
echo "   서버: $DEV_SERVER_HOST"
echo "   DB 호스트: $DEV_DB_HOST"
echo "   DB 이름: $DEV_DB_NAME"
echo "   DB 사용자: $DEV_DB_USER"
echo ""

# SSH로 개발 서버에 접속하여 DB 수정
echo "🔌 개발 서버에 접속하여 DB 수정 중..."
echo ""

ssh -o StrictHostKeyChecking=no ${DEV_SERVER_USER}@${DEV_SERVER_HOST} << 'ENDSSH'
    set -e
    
    # 환경 변수 로드
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
    fi
    
    DB_HOST="${DB_HOST:-localhost}"
    DB_NAME="${DB_NAME:-core_solution}"
    DB_USERNAME="${DB_USERNAME:-mindgarden_dev}"
    DB_PASSWORD="${DB_PASSWORD}"
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ DB_PASSWORD 환경 변수가 설정되지 않았습니다."
        exit 1
    fi
    
    echo "📋 현재 Flyway 마이그레이션 상태 확인..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} -e "
        SELECT version, description, type, script, checksum, installed_on, success 
        FROM flyway_schema_history 
        ORDER BY installed_rank;
    " || echo "⚠️  쿼리 실행 실패 (계속 진행)"
    
    echo ""
    echo "🔧 문제 해결 중..."
    echo ""
    
    # 1. V8이 로컬에 있지만 DB에 없거나 불일치하는 경우
    echo "1️⃣ V8 마이그레이션 처리..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        -- V8이 DB에 있지만 로컬 파일과 불일치하는 경우 삭제 (재실행을 위해)
        DELETE FROM flyway_schema_history WHERE version = '8';
        SELECT 'V8 마이그레이션 레코드 삭제 완료' AS result;
SQL
    
    # 2. V11 체크섬 업데이트 (로컬 파일의 체크섬: -1871002354)
    echo "2️⃣ V11 체크섬 업데이트..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -1871002354 
        WHERE version = '11';
        SELECT 'V11 체크섬 업데이트 완료' AS result;
SQL
    
    # 3. V13 체크섬 업데이트 (로컬 파일의 체크섬: 88086003)
    echo "3️⃣ V13 체크섬 업데이트..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = 88086003 
        WHERE version = '13';
        SELECT 'V13 체크섬 업데이트 완료' AS result;
SQL
    
    echo ""
    echo "✅ 수정 완료!"
    echo ""
    echo "📋 수정 후 Flyway 마이그레이션 상태:"
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} -e "
        SELECT version, description, type, checksum, installed_on, success 
        FROM flyway_schema_history 
        WHERE version IN ('8', '11', '13')
        ORDER BY version;
    " || echo "⚠️  쿼리 실행 실패"
    
    echo ""
    echo "🔄 서비스 재시작 권장:"
    echo "   sudo systemctl restart mindgarden-dev.service"
ENDSSH

echo ""
echo "✅ 개발 서버 Flyway 체크섬 수정 완료!"
echo ""
echo "📝 다음 단계:"
echo "   1. 개발 서버에서 서비스 재시작: sudo systemctl restart mindgarden-dev.service"
echo "   2. 서비스 상태 확인: sudo systemctl status mindgarden-dev.service"
echo ""

