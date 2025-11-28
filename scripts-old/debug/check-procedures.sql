-- 프로시저 존재 확인
SHOW PROCEDURE STATUS WHERE Db = 'core_solution' AND Name IN ('ProcessOnboardingApproval', 'CreateOrActivateTenant', 'SetupTenantCategoryMapping', 'ActivateDefaultComponents', 'CreateDefaultSubscription', 'ApplyDefaultRoleTemplates', 'GenerateErdOnOnboardingApproval');

-- 최근 온보딩 요청
SELECT id, tenant_id, tenant_name, status, decision_status, decision_note FROM onboarding_requests ORDER BY id DESC LIMIT 3;

-- 최근 테넌트
SELECT tenant_id, name, status, business_type, created_at FROM tenants ORDER BY created_at DESC LIMIT 5;

-- MySQL 버전
SELECT VERSION();

