#!/bin/bash
# 개발 서버 Flyway 체크섬 불일치 자동 해결 스크립트
# 모든 불일치 버전의 체크섬을 로컬 파일 기준으로 업데이트

set -e

echo "🔧 개발 서버 Flyway 체크섬 불일치 자동 해결 시작..."
echo ""

# 개발 서버 정보
DEV_SERVER_HOST="${DEV_SERVER_HOST:-114.202.247.246}"
DEV_SERVER_USER="${DEV_SERVER_USER:-root}"

echo "📋 개발 서버 정보:"
echo "   서버: $DEV_SERVER_HOST"
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
        SELECT version, description, checksum, installed_on 
        FROM flyway_schema_history 
        WHERE version IN ('10', '13', '14', '15', '22', '23', '24', '25', '32')
        ORDER BY version;
    " || echo "⚠️  쿼리 실행 실패 (계속 진행)"
    
    echo ""
    echo "🔧 문제 해결 중..."
    echo ""
    
    # 로그에서 확인된 로컬 파일의 체크섬 값으로 업데이트
    echo "1️⃣ V10 체크섬 업데이트 (로컬: -681275379)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -681275379 
        WHERE version = '10';
        SELECT 'V10 체크섬 업데이트 완료' AS result;
SQL
    
    echo "2️⃣ V13 체크섬 업데이트 (로컬: 637771731)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = 637771731 
        WHERE version = '13';
        SELECT 'V13 체크섬 업데이트 완료' AS result;
SQL
    
    echo "3️⃣ V14 체크섬 업데이트 (로컬: 1871286027)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = 1871286027 
        WHERE version = '14';
        SELECT 'V14 체크섬 업데이트 완료' AS result;
SQL
    
    echo "4️⃣ V15 체크섬 업데이트 (로컬: -1049110384)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -1049110384 
        WHERE version = '15';
        SELECT 'V15 체크섬 업데이트 완료' AS result;
SQL
    
    echo "5️⃣ V22 체크섬 업데이트 (로컬: 1798070545)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = 1798070545 
        WHERE version = '22';
        SELECT 'V22 체크섬 업데이트 완료' AS result;
SQL
    
    echo "6️⃣ V23 체크섬 업데이트 (로컬: -1007179464)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -1007179464 
        WHERE version = '23';
        SELECT 'V23 체크섬 업데이트 완료' AS result;
SQL
    
    echo "7️⃣ V24 체크섬 업데이트 (로컬: -1535502677)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -1535502677 
        WHERE version = '24';
        SELECT 'V24 체크섬 업데이트 완료' AS result;
SQL
    
    echo "8️⃣ V25 체크섬 업데이트 (로컬: 1693674553)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = 1693674553 
        WHERE version = '25';
        SELECT 'V25 체크섬 업데이트 완료' AS result;
SQL
    
    echo "9️⃣ V32 체크섬 업데이트 (로컬: -383360438)..."
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} << 'SQL'
        UPDATE flyway_schema_history 
        SET checksum = -383360438 
        WHERE version = '32';
        SELECT 'V32 체크섬 업데이트 완료' AS result;
SQL
    
    echo ""
    echo "✅ 모든 체크섬 업데이트 완료!"
    echo ""
    echo "📋 수정 후 Flyway 마이그레이션 상태:"
    mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} -e "
        SELECT version, description, checksum, installed_on 
        FROM flyway_schema_history 
        WHERE version IN ('10', '13', '14', '15', '22', '23', '24', '25', '32')
        ORDER BY version;
    " || echo "⚠️  쿼리 실행 실패"
    
    echo ""
    echo "🔄 서비스 재시작 중..."
    systemctl restart mindgarden-dev.service || echo "⚠️  서비스 재시작 실패 (수동으로 재시작 필요)"
    
    echo ""
    echo "⏳ 서비스 시작 대기 중 (10초)..."
    sleep 10
    
    echo ""
    echo "🔍 서비스 상태 확인..."
    systemctl status mindgarden-dev.service --no-pager -l | head -20 || echo "⚠️  서비스 상태 확인 실패"
ENDSSH

echo ""
echo "✅ 개발 서버 Flyway 체크섬 수정 완료!"
echo ""
echo "📝 다음 단계:"
echo "   1. 서비스 상태 확인: ssh root@beta0629.cafe24.com 'systemctl status mindgarden-dev.service'"
echo "   2. 로그 확인: ssh root@beta0629.cafe24.com 'journalctl -u mindgarden-dev.service -n 50'"
echo ""

