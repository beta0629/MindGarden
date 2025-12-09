-- beta74@live.co.kr 온보딩 등록 확인 스크립트

-- 1. 온보딩 요청 상태 확인 (최신 5개)
SELECT 
    id,
    tenant_id,
    tenant_name,
    requested_by,
    status,
    risk_level,
    business_type,
    decision_at,
    decided_by,
    created_at,
    updated_at,
    is_deleted,
    CASE 
        WHEN checklist_json IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_checklist_json,
    CASE 
        WHEN checklist_json LIKE '%adminPassword%' THEN 'YES'
        ELSE 'NO'
    END as has_admin_password,
    CASE 
        WHEN checklist_json LIKE '%planId%' THEN 'YES'
        ELSE 'NO'
    END as has_plan_id
FROM onboarding_request
WHERE requested_by = 'beta74@live.co.kr' 
   OR requested_by LIKE '%beta74%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 테넌트 생성 여부 확인
SELECT 
    tenant_id,
    name,
    contact_email,
    status,
    business_type,
    is_deleted,
    deleted_at,
    created_at,
    updated_at
FROM tenants
WHERE contact_email = 'beta74@live.co.kr'
   OR name LIKE '%beta74%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. 사용자 계정 생성 여부 확인
SELECT 
    u.id,
    u.email,
    u.username,
    u.name,
    u.tenant_id,
    u.role,
    u.is_active,
    u.is_deleted,
    u.is_email_verified,
    u.created_at,
    t.name as tenant_name,
    t.status as tenant_status
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
WHERE u.email = 'beta74@live.co.kr'
   OR u.email LIKE '%beta74%'
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. 온보딩 요청의 상세 정보 (checklist_json 일부)
SELECT 
    id,
    tenant_name,
    status,
    business_type,
    risk_level,
    SUBSTRING(checklist_json, 1, 500) as checklist_json_preview,
    created_at
FROM onboarding_request
WHERE requested_by = 'beta74@live.co.kr'
ORDER BY created_at DESC
LIMIT 1;

-- 5. 최근 온보딩 요청 통계
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as latest_request
FROM onboarding_request
WHERE requested_by = 'beta74@live.co.kr'
GROUP BY status;

