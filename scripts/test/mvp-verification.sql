-- MVP 온보딩 플로우 검증 SQL 스크립트
-- 1월 심사/발표를 위한 최소 기능 검증

-- 사용법:
-- 1. 온보딩 승인 후 실행
-- 2. TENANT_ID 변수를 실제 테넌트 ID로 변경

SET @TENANT_ID = 'test-consultation-1234567890';  -- 실제 테넌트 ID로 변경
SET @EMAIL = 'admin@consultation-1234567890.com';  -- 실제 이메일로 변경

-- ============================================
-- 1. 테넌트 생성 확인
-- ============================================
SELECT 
    '1. 테넌트 생성 확인' AS test_step,
    tenant_id,
    name,
    business_type,
    status,
    created_at
FROM tenants
WHERE tenant_id = @TENANT_ID;

-- ============================================
-- 2. settings_json features 확인
-- ============================================
SELECT 
    '2. settings_json features 확인' AS test_step,
    tenant_id,
    name,
    JSON_EXTRACT(settings_json, '$.features.consultation') AS consultation_enabled,
    JSON_EXTRACT(settings_json, '$.features.academy') AS academy_enabled,
    JSON_EXTRACT(settings_json, '$.subdomain') AS subdomain,
    JSON_EXTRACT(settings_json, '$.domain') AS domain
FROM tenants
WHERE tenant_id = @TENANT_ID;

-- ============================================
-- 3. 관리자 계정 생성 확인
-- ============================================
SELECT 
    '3. 관리자 계정 생성 확인' AS test_step,
    id,
    tenant_id,
    email,
    username,
    name,
    role,
    is_active,
    is_email_verified,
    created_at
FROM users
WHERE tenant_id = @TENANT_ID
  AND email = @EMAIL
  AND role = 'ADMIN'
  AND (is_deleted IS NULL OR is_deleted = FALSE);

-- ============================================
-- 4. 기본 대시보드 생성 확인
-- ============================================
SELECT 
    '4. 기본 대시보드 생성 확인' AS test_step,
    dashboard_id,
    tenant_id,
    dashboard_type,
    dashboard_name,
    role_code,
    is_default,
    JSON_LENGTH(JSON_EXTRACT(dashboard_config, '$.widgets')) AS widget_count,
    created_at
FROM tenant_dashboards
WHERE tenant_id = @TENANT_ID
  AND is_default = TRUE
ORDER BY created_at;

-- ============================================
-- 5. 대시보드 위젯 상세 확인
-- ============================================
SELECT 
    '5. 대시보드 위젯 상세 확인' AS test_step,
    dashboard_id,
    dashboard_name,
    JSON_EXTRACT(dashboard_config, '$.widgets') AS widgets
FROM tenant_dashboards
WHERE tenant_id = @TENANT_ID
  AND is_default = TRUE
LIMIT 1;

-- ============================================
-- 6. 기본 컴포넌트 활성화 확인
-- ============================================
SELECT 
    '6. 기본 컴포넌트 활성화 확인' AS test_step,
    tc.tenant_component_id,
    tc.tenant_id,
    tc.component_id,
    cc.component_name,
    cc.component_type,
    tc.status,
    tc.activated_at,
    tc.activated_by
FROM tenant_components tc
JOIN component_catalog cc ON tc.component_id = cc.component_id
WHERE tc.tenant_id = @TENANT_ID
  AND tc.status = 'ACTIVE'
ORDER BY tc.activated_at;

-- ============================================
-- 7. 온보딩 요청 상태 확인
-- ============================================
SELECT 
    '7. 온보딩 요청 상태 확인' AS test_step,
    id,
    tenant_id,
    tenant_name,
    status,
    requested_by,
    decided_by,
    decision_note,
    created_at,
    decided_at
FROM onboarding_requests
WHERE tenant_id = @TENANT_ID
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 8. 종합 검증 요약
-- ============================================
SELECT 
    '8. 종합 검증 요약' AS test_step,
    (SELECT COUNT(*) FROM tenants WHERE tenant_id = @TENANT_ID) AS tenant_exists,
    (SELECT COUNT(*) FROM users WHERE tenant_id = @TENANT_ID AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE)) AS admin_account_exists,
    (SELECT COUNT(*) FROM tenant_dashboards WHERE tenant_id = @TENANT_ID AND is_default = TRUE) AS dashboard_count,
    (SELECT COUNT(*) FROM tenant_components WHERE tenant_id = @TENANT_ID AND status = 'ACTIVE') AS component_count,
    (SELECT JSON_EXTRACT(settings_json, '$.features.consultation') FROM tenants WHERE tenant_id = @TENANT_ID) AS consultation_feature_enabled,
    (SELECT JSON_EXTRACT(settings_json, '$.features.academy') FROM tenants WHERE tenant_id = @TENANT_ID) AS academy_feature_enabled;

