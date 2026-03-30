#!/bin/bash
# 온보딩 프로세스 종합 진단 스크립트
# 체계적으로 모든 문제를 진단합니다.

set -e

echo "=========================================="
echo "🔍 온보딩 프로세스 종합 진단"
echo "=========================================="
echo ""

# 환경 변수 로드
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
    echo "✅ 환경 변수 로드 완료"
else
    echo "❌ 환경 변수 파일 없음: /etc/mindgarden/dev.env"
    exit 1
fi

# 1. 데이터베이스 연결 확인
echo ""
echo "=========================================="
echo "1️⃣ 데이터베이스 연결 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT '데이터베이스 연결 성공' as status;" || {
    echo "❌ 데이터베이스 연결 실패"
    exit 1
}
echo "✅ 데이터베이스 연결 성공"
echo ""

# 2. Flyway 마이그레이션 상태 확인
echo "=========================================="
echo "2️⃣ Flyway 마이그레이션 상태 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" << 'SQL'
SELECT 
    installed_rank,
    version,
    description,
    type,
    installed_on,
    success
FROM flyway_schema_history
WHERE version LIKE 'V20251225%' OR version LIKE 'V20251223%' OR version LIKE 'V20251212%'
ORDER BY installed_rank DESC;
SQL
echo ""

# 3. role_templates 테이블 상태 확인
echo "=========================================="
echo "3️⃣ role_templates 테이블 상태 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" << 'SQL'
SELECT 
    business_type,
    COUNT(*) as count,
    GROUP_CONCAT(template_code ORDER BY display_order) as templates
FROM role_templates 
WHERE is_deleted = FALSE AND is_active = TRUE
GROUP BY business_type
ORDER BY business_type;
SQL
echo ""

# 4. COUNSELING 업종 템플릿 상세 확인
echo "=========================================="
echo "4️⃣ COUNSELING 업종 템플릿 상세 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" << 'SQL'
SELECT 
    template_code,
    name_ko,
    business_type,
    is_active,
    is_deleted,
    display_order
FROM role_templates 
WHERE business_type = 'COUNSELING'
ORDER BY display_order;
SQL
echo ""

# 5. 프로시저 존재 및 정의 확인
echo "=========================================="
echo "5️⃣ 프로시저 존재 및 정의 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" << 'SQL'
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED,
    LAST_ALTERED,
    ROUTINE_DEFINITION IS NOT NULL as has_definition
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
AND ROUTINE_NAME IN ('ProcessOnboardingApproval', 'CreateOrActivateTenant', 'ApplyDefaultRoleTemplates', 'CreateTenantAdminAccount')
ORDER BY ROUTINE_NAME;
SQL
echo ""

# 6. 최근 온보딩 요청 상태 확인
echo "=========================================="
echo "6️⃣ 최근 온보딩 요청 상태 확인"
echo "=========================================="
mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" << 'SQL'
SELECT 
    id,
    tenant_id,
    tenant_name,
    business_type,
    status,
    SUBSTRING(decision_note, 1, 200) as decision_note_preview,
    created_at,
    updated_at
FROM onboarding_requests
ORDER BY created_at DESC
LIMIT 10;
SQL
echo ""

# 7. 최근 온보딩 프로세스 로그 확인
echo "=========================================="
echo "7️⃣ 최근 온보딩 프로세스 로그 확인"
echo "=========================================="
sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i -E "(온보딩|onboarding|ProcessOnboardingApproval|프로시저 실행|프로시저 결과|프로시저 실패|메타데이터 검증|roleTemplates|COUNSELING|권한 그룹|commonCodes|roleCodes|permissionGroups|Transaction.*rolled back|알 수 없는 오류|시스템 메타데이터 검증)" | tail -100 || echo "온보딩 관련 로그 없음"
echo ""

# 8. 에러 로그 확인
echo "=========================================="
echo "8️⃣ 에러 로그 확인"
echo "=========================================="
sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i "ERROR" | grep -i -E "(온보딩|onboarding)" | tail -50 || echo "온보딩 관련 에러 없음"
echo ""

# 9. 애플리케이션 상태 확인
echo "=========================================="
echo "9️⃣ 애플리케이션 상태 확인"
echo "=========================================="
sudo systemctl status mindgarden-dev.service --no-pager -l | head -30
echo ""

echo "=========================================="
echo "✅ 종합 진단 완료"
echo "=========================================="

