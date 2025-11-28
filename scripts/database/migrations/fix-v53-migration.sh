#!/bin/bash

# V53 마이그레이션 실패 기록 정리 스크립트

echo "🔧 V53 마이그레이션 실패 기록 정리 시작..."

# 데이터베이스 연결 정보
DB_HOST="114.202.247.246"
DB_PORT="3306"
DB_NAME="core_solution"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"

# V53 실패 기록 삭제
echo "📋 V53 실패 기록 삭제 중..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME << EOF
DELETE FROM flyway_schema_history WHERE version = '53' AND success = 0;
SELECT '실패한 V53 기록 삭제 완료' AS message;
EOF

echo "✅ V53 마이그레이션 실패 기록 정리 완료!"
echo "🚀 이제 백엔드 서버를 재시작하면 V53 마이그레이션이 다시 실행됩니다."
