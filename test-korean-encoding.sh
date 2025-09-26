#!/bin/bash

# 한글 인코딩 테스트 스크립트
# PL/SQL 프로시저의 한글 처리 확인

export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8

echo "🔍 한글 인코딩 테스트 시작..."

# 데이터베이스 연결 정보
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-mindgarden}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

echo "📊 데이터베이스 문자셋 확인..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME -e "
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
"

echo ""
echo "📋 지점 코드 한글 확인..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME -e "
SELECT code_value, code_label, code_group 
FROM common_codes 
WHERE code_group = 'BRANCH' 
LIMIT 5;
"

echo ""
echo "🔍 PL/SQL 프로시저 한글 주석 확인..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME -e "
SELECT ROUTINE_NAME, ROUTINE_COMMENT 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = '$DB_NAME' 
AND ROUTINE_NAME LIKE '%Financial%';
"

echo ""
echo "✅ 한글 인코딩 테스트 완료!"
echo "📝 확인사항:"
echo "  - character_set_server: utf8mb4"
echo "  - character_set_database: utf8mb4"
echo "  - character_set_client: utf8mb4"
echo "  - 지점명이 한글로 정상 표시되는지 확인"
echo "  - PL/SQL 프로시저 주석이 한글로 정상 표시되는지 확인"
