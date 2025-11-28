#!/bin/bash
# CreateOrActivateTenant 프로시저 수동 배포 스크립트
# 사용법: ./scripts/deploy-procedure.sh [서버호스트] [사용자]

SERVER_HOST="${1:-114.202.247.246}"
SERVER_USER="${2:-root}"
SQL_FILE="MindGarden/scripts/manual_create_procedure.sql"
REMOTE_FILE="/tmp/manual_create_procedure.sql"

echo "🚀 프로시저 배포 시작..."
echo "   서버: $SERVER_USER@$SERVER_HOST"
echo "   파일: $SQL_FILE"

# 1. SQL 파일 존재 확인
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    # 경로 조정 시도
    if [ -f "scripts/manual_create_procedure.sql" ]; then
        SQL_FILE="scripts/manual_create_procedure.sql"
        echo "⚠️  경로 조정됨: $SQL_FILE"
    else
        exit 1
    fi
fi

# 2. 서버로 파일 복사
echo "📤 SQL 파일 업로드 중..."
scp "$SQL_FILE" "$SERVER_USER@$SERVER_HOST:$REMOTE_FILE"

if [ $? -ne 0 ]; then
    echo "❌ 파일 업로드 실패"
    exit 1
fi

# 3. 서버에서 SQL 실행
echo "🔧 서버에서 SQL 실행 중..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
    fi
    
    DB_USER="\${DB_USERNAME:-mindgarden_dev}"
    DB_PASS="\${DB_PASSWORD}"
    DB_NAME="\${DB_NAME:-core_solution}"
    
    echo "   DB 사용자: \$DB_USER"
    echo "   DB 이름: \$DB_NAME"
    
    if [ -z "\$DB_PASS" ]; then
        echo "❌ DB 비밀번호를 찾을 수 없습니다."
        exit 1
    fi
    
    # DELIMITER를 처리하기 위해 source 명령어 사용
    mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "source $REMOTE_FILE"
    
    if [ \$? -eq 0 ]; then
        echo "✅ 프로시저 생성 성공"
        # 생성 확인
        echo "📋 프로시저 확인:"
        mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "SHOW PROCEDURE STATUS WHERE Name = 'CreateOrActivateTenant';"
        rm "$REMOTE_FILE"
    else
        echo "❌ 프로시저 생성 실패"
        exit 1
    fi
EOF

echo "✨ 배포 완료"

