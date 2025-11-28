#!/bin/bash
# 온보딩 프로시저 빠른 확인 스크립트

DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"
DB_HOST="beta0629.cafe24.com"

echo "=========================================="
echo "온보딩 프로시저 디버깅 체크"
echo "=========================================="

echo -e "\n[1] 프로시저 존재 확인"
ssh root@$DB_HOST "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e \"SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name IN ('ProcessOnboardingApproval', 'CreateOrActivateTenant', 'SetupTenantCategoryMapping', 'ActivateDefaultComponents', 'CreateDefaultSubscription', 'ApplyDefaultRoleTemplates', 'GenerateErdOnOnboardingApproval');\""

echo -e "\n[2] 최근 온보딩 요청 (최근 3개)"
ssh root@$DB_HOST "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e \"SELECT id, tenant_id, tenant_name, status, decision_status, decision_note FROM onboarding_requests ORDER BY id DESC LIMIT 3;\""

echo -e "\n[3] 최근 테넌트 (최근 5개)"
ssh root@$DB_HOST "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e \"SELECT tenant_id, name, status, business_type, created_at FROM tenants ORDER BY created_at DESC LIMIT 5;\""

echo -e "\n[4] MySQL 버전 확인"
ssh root@$DB_HOST "mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e \"SELECT VERSION();\""

echo -e "\n[5] 최근 백엔드 로그 (온보딩 관련)"
ssh root@$DB_HOST "journalctl -u mindgarden-dev.service --since '30 minutes ago' --no-pager | grep -i '온보딩\|onboarding\|tenant\|프로시저\|procedure' | tail -20"

echo -e "\n=========================================="
echo "체크 완료"
echo "=========================================="

