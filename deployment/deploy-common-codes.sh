#!/bin/bash

# 공통코드 배포 스크립트
# GitHub Actions에서 자동으로 실행되는 스크립트

set -e

echo "🔄 공통코드 배포 시작..."

# MySQL 연결 정보
# B8 (P0 보안, 2026-06-12): 저장소 평문 비밀번호 제거 — 환경변수 주입 필수.
# - GitHub Actions: 워크플로 env 로 PRODUCTION_DB_PASSWORD 주입 (deploy-production.yml 참조)
# - 운영 SSH 직접 실행: source /etc/mindgarden/prod.env 또는 DB_PASSWORD 환경변수 export
DB_HOST="localhost"
DB_USER="mindgarden"
DB_PASSWORD="${PRODUCTION_DB_PASSWORD:-${DB_PASSWORD:-}}"
: "${DB_PASSWORD:?DB_PASSWORD 또는 PRODUCTION_DB_PASSWORD 환경변수가 필요합니다. /etc/mindgarden/prod.env 를 source 하거나 GitHub Secrets PRODUCTION_DB_PASSWORD 를 워크플로 env 로 주입하세요.}"
DB_NAME="mind_garden"

# 공통코드 SQL 파일 경로
COMMON_CODES_SQL="/var/www/mindgarden/deployment/complete-common-codes-migration.sql"

if [ -f "$COMMON_CODES_SQL" ]; then
    echo "📦 공통코드 마이그레이션 실행 중..."
    
    # MySQL에 공통코드 삽입/업데이트
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$COMMON_CODES_SQL"
    
    if [ $? -eq 0 ]; then
        echo "✅ 공통코드 마이그레이션 성공"
        
        # 공통코드 개수 확인
        COMMON_CODE_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM common_codes WHERE is_active = 1;")
        echo "📊 활성화된 공통코드 개수: $COMMON_CODE_COUNT"
        
        # BRANCH 그룹 공통코드 확인
        BRANCH_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM common_codes WHERE code_group = 'BRANCH' AND is_active = 1;")
        echo "🏢 활성화된 지점 코드 개수: $BRANCH_COUNT"
        
    else
        echo "❌ 공통코드 마이그레이션 실패"
        exit 1
    fi
else
    echo "⚠️ 공통코드 SQL 파일을 찾을 수 없음: $COMMON_CODES_SQL"
    echo "📝 공통코드 마이그레이션을 건너뜁니다."
fi

echo "🎉 공통코드 배포 완료"
