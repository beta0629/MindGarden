-- ============================================
-- Week 3 Day 1: Week 0.5 테이블 의존성 검증
-- ============================================
-- 목적: PL/SQL 프로시저가 필요로 하는 모든 테이블이 존재하는지 확인
-- 작성일: 2025-01-XX
-- 주의: 이 스크립트는 검증용이며, 테이블이 없으면 오류를 발생시킵니다.
-- ============================================

-- ============================================
-- 필수 테이블 존재 여부 확인
-- ============================================

-- 1. tenants 테이블 (Week 0)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tenants';

-- 2. business_categories 테이블 (Week 0.5 Day 1)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'business_categories';

-- 3. business_category_items 테이블 (Week 0.5 Day 1)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'business_category_items';

-- 4. tenant_category_mappings 테이블 (Week 0.5 Day 1)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tenant_category_mappings';

-- 5. component_catalog 테이블 (Week 0.5 Day 2)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'component_catalog';

-- 6. component_features 테이블 (Week 0.5 Day 2)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'component_features';

-- 7. component_pricing 테이블 (Week 0.5 Day 2)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'component_pricing';

-- 8. component_dependencies 테이블 (Week 0.5 Day 2)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'component_dependencies';

-- 9. tenant_components 테이블 (Week 0.5 Day 2)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tenant_components';

-- 10. pricing_plans 테이블 (Week 0.5 Day 3)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'pricing_plans';

-- 11. pricing_plan_features 테이블 (Week 0.5 Day 3)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'pricing_plan_features';

-- 12. tenant_subscriptions 테이블 (Week 0.5 Day 3)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tenant_subscriptions';

-- 13. role_templates 테이블 (Week 0.5 Day 4)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'role_templates';

-- 14. role_template_permissions 테이블 (Week 0.5 Day 4)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'role_template_permissions';

-- 15. role_template_mappings 테이블 (Week 0.5 Day 4)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'role_template_mappings';

-- 16. tenant_roles 테이블 (Week 0.5 Day 4)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tenant_roles';

-- 17. role_permissions 테이블 (Week 0.5 Day 4)
SELECT COUNT(*) AS table_exists 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'role_permissions';

-- ============================================
-- 통합 검증 쿼리 (모든 필수 테이블 존재 확인)
-- ============================================
SELECT 
    TABLE_NAME,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'tenants',
    'business_categories',
    'business_category_items',
    'tenant_category_mappings',
    'component_catalog',
    'component_features',
    'component_pricing',
    'component_dependencies',
    'tenant_components',
    'pricing_plans',
    'pricing_plan_features',
    'tenant_subscriptions',
    'role_templates',
    'role_template_permissions',
    'role_template_mappings',
    'tenant_roles',
    'role_permissions'
  )
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

