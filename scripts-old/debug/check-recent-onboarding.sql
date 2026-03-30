-- 최근 온보딩 요청 확인
SELECT 
    id,
    tenant_id,
    tenant_name,
    status,
    decision_note,
    created_at
FROM onboarding_request
ORDER BY id DESC
LIMIT 3;

-- 최근 생성된 테넌트 확인
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    created_at
FROM tenants
ORDER BY created_at DESC
LIMIT 5;

-- tenant-unknown-consultation-001 테넌트 확인
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    settings_json,
    created_at
FROM tenants
WHERE tenant_id LIKE 'tenant-unknown%'
ORDER BY created_at DESC
LIMIT 5;

