-- beta74@live.co.kr 로그인 문제 진단 스크립트

-- 1. 온보딩 요청 상태 확인
SELECT 
    id,
    tenant_name,
    requested_by,
    contact_email,
    status,
    decision_at,
    created_at,
    checklist_json IS NOT NULL as has_checklist_json,
    CASE 
        WHEN checklist_json LIKE '%adminPassword%' THEN 'YES'
        ELSE 'NO'
    END as has_admin_password
FROM onboarding_requests
WHERE requested_by = 'beta74@live.co.kr' 
   OR contact_email = 'beta74@live.co.kr'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 테넌트 상태 확인
SELECT 
    tenant_id,
    name,
    contact_email,
    status,
    is_deleted,
    deleted_at,
    created_at
FROM tenants
WHERE contact_email = 'beta74@live.co.kr'
ORDER BY created_at DESC
LIMIT 5;

-- 3. 사용자 계정 확인
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
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. 온보딩 요청의 checklistJson 확인 (adminPassword 포함 여부)
SELECT 
    id,
    tenant_name,
    status,
    SUBSTRING(checklist_json, 1, 200) as checklist_json_preview
FROM onboarding_requests
WHERE (requested_by = 'beta74@live.co.kr' OR contact_email = 'beta74@live.co.kr')
  AND checklist_json IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

