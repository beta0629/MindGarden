-- 마인드가든 테넌트 생성
-- 서브도메인: mindgarden
-- 도메인: mindgarden.dev.core-solution.co.kr

INSERT INTO tenants (
    tenant_id,
    name,
    business_type,
    status,
    subscription_status,
    created_at,
    updated_at,
    is_deleted,
    version,
    lang_code
) VALUES (
    UUID(),
    '마인드가든',
    'CONSULTATION',
    'ACTIVE',
    'ACTIVE',
    NOW(),
    NOW(),
    FALSE,
    0,
    'ko'
);

-- 생성된 테넌트 확인
SELECT id, tenant_id, name, status, business_type, created_at 
FROM tenants 
WHERE name = '마인드가든' 
ORDER BY id DESC 
LIMIT 1;

