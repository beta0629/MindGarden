-- 마인드가든 테넌트 서브도메인 매핑 추가
UPDATE tenants 
SET settings_json = JSON_SET(
    COALESCE(settings_json, '{}'),
    '$.subdomain', 'mindgarden',
    '$.domain', 'mindgarden.dev.core-solution.co.kr'
)
WHERE name = '마인드가든';

-- 확인
SELECT id, tenant_id, name, settings_json 
FROM tenants 
WHERE name = '마인드가든';

