#!/bin/bash
# Flyway 마이그레이션 실행 스크립트
# 개발 서버 DB에 직접 마이그레이션 적용

set -e

echo "🚀 Flyway 마이그레이션 실행 시작..."
echo ""

# 환경 변수 확인
if [ -z "$DB_HOST" ]; then
    echo "⚠️  DB_HOST 환경 변수가 설정되지 않았습니다."
    echo "   개발 서버 DB 호스트를 설정해주세요:"
    echo "   export DB_HOST=beta0629.cafe24.com"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  DB_PASSWORD 환경 변수가 설정되지 않았습니다."
    echo "   데이터베이스 비밀번호를 설정해주세요:"
    echo "   export DB_PASSWORD='your-password'"
    exit 1
fi

DB_HOST=${DB_HOST:-beta0629.cafe24.com}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-mind_garden}
DB_USERNAME=${DB_USERNAME:-mindgarden_dev}

echo "📋 마이그레이션 설정:"
echo "   호스트: $DB_HOST"
echo "   포트: $DB_PORT"
echo "   데이터베이스: $DB_NAME"
echo "   사용자: $DB_USERNAME"
echo ""

# 마이그레이션 파일 목록 확인
echo "📁 마이그레이션 파일 확인..."
MIGRATION_FILES=$(find src/main/resources/db/migration -name "V*.sql" | sort -V)
MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l | tr -d ' ')

echo "   총 $MIGRATION_COUNT 개의 마이그레이션 파일 발견:"
echo "$MIGRATION_FILES" | nl -w2 -s'. '
echo ""

# Flyway를 사용하여 마이그레이션 실행
echo "🔧 Flyway 마이그레이션 실행 중..."
echo ""

# Maven을 사용하여 Flyway 마이그레이션 실행
if command -v mvn &> /dev/null; then
    echo "   Maven Flyway 플러그인 사용..."
    mvn flyway:migrate \
        -Dflyway.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8 \
        -Dflyway.user=${DB_USERNAME} \
        -Dflyway.password=${DB_PASSWORD} \
        -Dflyway.locations=classpath:db/migration \
        -Dflyway.baselineOnMigrate=true \
        -Dflyway.validateOnMigrate=true
elif command -v ./gradlew &> /dev/null; then
    echo "   Gradle Flyway 플러그인 사용..."
    ./gradlew flywayMigrate \
        -Pflyway.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8 \
        -Pflyway.user=${DB_USERNAME} \
        -Pflyway.password=${DB_PASSWORD} \
        -Pflyway.locations=classpath:db/migration \
        -Pflyway.baselineOnMigrate=true \
        -Pflyway.validateOnMigrate=true
else
    echo "⚠️  Maven 또는 Gradle이 설치되어 있지 않습니다."
    echo "   Spring Boot 애플리케이션을 실행하면 Flyway가 자동으로 마이그레이션을 실행합니다."
    echo ""
    echo "   또는 수동으로 마이그레이션을 실행하려면:"
    echo "   mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME < src/main/resources/db/migration/V1__create_tenants_table.sql"
    exit 1
fi

echo ""
echo "✅ Flyway 마이그레이션 완료!"
echo ""
echo "📊 마이그레이션 상태 확인:"
echo "   mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME -e \"SELECT * FROM flyway_schema_history ORDER BY installed_rank;\""

