
SELECT 
    u.email,
    u.role,
    u.name,
    t.tenant_id,
    t.name as tenant_name,
    t.business_type
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
WHERE u.email LIKE '%@%' 
  AND (u.role LIKE '%ADMIN%' OR u.role LIKE '%MANAGER%' OR u.role LIKE '%OWNER%')
ORDER BY u.created_at DESC
LIMIT 10;

