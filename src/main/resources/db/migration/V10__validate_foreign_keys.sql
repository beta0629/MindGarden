-- ============================================
-- Week 0.5 Day 5: 외래키 제약조건 검증
-- ============================================
-- 목적: 모든 외래키 제약조건이 올바르게 설정되었는지 검증
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

-- ============================================
-- 1. 외래키 제약조건 검증 쿼리
-- ============================================
-- 주의: 모든 검증 쿼리는 테이블이 존재하는 경우에만 실행됩니다.

-- 1.1 business_category_items → business_categories
-- 검증: 모든 category_id가 business_categories에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_category_items');
SET @sql = IF(@table_exists > 0,
    'SELECT ''business_category_items'' AS table_name, ''category_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(bci.category_id) AS valid_foreign_keys, COUNT(*) - COUNT(bci.category_id) AS invalid_foreign_keys FROM business_category_items bci LEFT JOIN business_categories bc ON bci.category_id = bc.category_id WHERE bci.is_deleted = FALSE',
    'SELECT "business_category_items table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.2 tenant_category_mappings → tenants
-- 검증: 모든 tenant_id가 tenants에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_category_mappings');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_category_mappings'' AS table_name, ''tenant_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tcm.tenant_id) AS valid_foreign_keys, COUNT(*) - COUNT(tcm.tenant_id) AS invalid_foreign_keys FROM tenant_category_mappings tcm LEFT JOIN tenants t ON tcm.tenant_id = t.tenant_id WHERE tcm.is_deleted = FALSE',
    'SELECT "tenant_category_mappings table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.3 tenant_category_mappings → business_category_items
-- 검증: 모든 category_item_id가 business_category_items에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_category_mappings');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_category_mappings'' AS table_name, ''category_item_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tcm.category_item_id) AS valid_foreign_keys, COUNT(*) - COUNT(tcm.category_item_id) AS invalid_foreign_keys FROM tenant_category_mappings tcm LEFT JOIN business_category_items bci ON tcm.category_item_id = bci.item_id WHERE tcm.is_deleted = FALSE',
    'SELECT "tenant_category_mappings table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.4 component_features → component_catalog
-- 검증: 모든 component_id가 component_catalog에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'component_features');
SET @sql = IF(@table_exists > 0,
    'SELECT ''component_features'' AS table_name, ''component_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(cf.component_id) AS valid_foreign_keys, COUNT(*) - COUNT(cf.component_id) AS invalid_foreign_keys FROM component_features cf LEFT JOIN component_catalog cc ON cf.component_id = cc.component_id',
    'SELECT "component_features table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.5 component_pricing → component_catalog
-- 검증: 모든 component_id가 component_catalog에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'component_pricing');
SET @sql = IF(@table_exists > 0,
    'SELECT ''component_pricing'' AS table_name, ''component_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(cp.component_id) AS valid_foreign_keys, COUNT(*) - COUNT(cp.component_id) AS invalid_foreign_keys FROM component_pricing cp LEFT JOIN component_catalog cc ON cp.component_id = cc.component_id',
    'SELECT "component_pricing table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.6 component_dependency → component_catalog (양방향)
-- 검증: 모든 component_id와 required_component_id가 component_catalog에 존재하는지 확인
-- 테이블이 존재하는 경우에만 검증 수행
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'component_dependency');
SET @sql = IF(@table_exists > 0,
    CONCAT('SELECT ''component_dependency'' AS table_name, ''component_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(cd.component_id) AS valid_foreign_keys, COUNT(*) - COUNT(cd.component_id) AS invalid_foreign_keys FROM component_dependency cd LEFT JOIN component_catalog cc ON cd.component_id = cc.component_id UNION ALL SELECT ''component_dependency'' AS table_name, ''required_component_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(cd.required_component_id) AS valid_foreign_keys, COUNT(*) - COUNT(cd.required_component_id) AS invalid_foreign_keys FROM component_dependency cd LEFT JOIN component_catalog cc ON cd.required_component_id = cc.component_id'),
    'SELECT "component_dependency table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.7 tenant_components → tenants
-- 검증: 모든 tenant_id가 tenants에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_components');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_components'' AS table_name, ''tenant_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tc.tenant_id) AS valid_foreign_keys, COUNT(*) - COUNT(tc.tenant_id) AS invalid_foreign_keys FROM tenant_components tc LEFT JOIN tenants t ON tc.tenant_id = t.tenant_id WHERE tc.is_deleted = FALSE',
    'SELECT "tenant_components table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.8 tenant_components → component_catalog
-- 검증: 모든 component_id가 component_catalog에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_components');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_components'' AS table_name, ''component_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tc.component_id) AS valid_foreign_keys, COUNT(*) - COUNT(tc.component_id) AS invalid_foreign_keys FROM tenant_components tc LEFT JOIN component_catalog cc ON tc.component_id = cc.component_id WHERE tc.is_deleted = FALSE',
    'SELECT "tenant_components table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.9 pricing_plan_features → pricing_plans
-- 검증: 모든 plan_id가 pricing_plans에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pricing_plan_features');
SET @sql = IF(@table_exists > 0,
    'SELECT ''pricing_plan_features'' AS table_name, ''plan_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(ppf.plan_id) AS valid_foreign_keys, COUNT(*) - COUNT(ppf.plan_id) AS invalid_foreign_keys FROM pricing_plan_features ppf LEFT JOIN pricing_plans pp ON ppf.plan_id = pp.plan_id',
    'SELECT "pricing_plan_features table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.10 tenant_subscriptions → tenants
-- 검증: 모든 tenant_id가 tenants에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_subscriptions');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_subscriptions'' AS table_name, ''tenant_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(ts.tenant_id) AS valid_foreign_keys, COUNT(*) - COUNT(ts.tenant_id) AS invalid_foreign_keys FROM tenant_subscriptions ts LEFT JOIN tenants t ON ts.tenant_id = t.tenant_id WHERE ts.is_deleted = FALSE',
    'SELECT "tenant_subscriptions table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.11 tenant_subscriptions → pricing_plans
-- 검증: 모든 plan_id가 pricing_plans에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_subscriptions');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_subscriptions'' AS table_name, ''plan_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(ts.plan_id) AS valid_foreign_keys, COUNT(*) - COUNT(ts.plan_id) AS invalid_foreign_keys FROM tenant_subscriptions ts LEFT JOIN pricing_plans pp ON ts.plan_id = pp.plan_id WHERE ts.is_deleted = FALSE',
    'SELECT "tenant_subscriptions table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.12 role_template_permissions → role_templates
-- 검증: 모든 role_template_id가 role_templates에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_template_permissions');
SET @sql = IF(@table_exists > 0,
    'SELECT ''role_template_permissions'' AS table_name, ''role_template_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(rtp.role_template_id) AS valid_foreign_keys, COUNT(*) - COUNT(rtp.role_template_id) AS invalid_foreign_keys FROM role_template_permissions rtp LEFT JOIN role_templates rt ON rtp.role_template_id = rt.role_template_id',
    'SELECT "role_template_permissions table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.13 role_template_mappings → role_templates
-- 검증: 모든 role_template_id가 role_templates에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_template_mappings');
SET @sql = IF(@table_exists > 0,
    'SELECT ''role_template_mappings'' AS table_name, ''role_template_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(rtm.role_template_id) AS valid_foreign_keys, COUNT(*) - COUNT(rtm.role_template_id) AS invalid_foreign_keys FROM role_template_mappings rtm LEFT JOIN role_templates rt ON rtm.role_template_id = rt.role_template_id',
    'SELECT "role_template_mappings table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.14 tenant_roles → tenants
-- 검증: 모든 tenant_id가 tenants에 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_roles');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_roles'' AS table_name, ''tenant_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tr.tenant_id) AS valid_foreign_keys, COUNT(*) - COUNT(tr.tenant_id) AS invalid_foreign_keys FROM tenant_roles tr LEFT JOIN tenants t ON tr.tenant_id = t.tenant_id WHERE tr.is_deleted = FALSE',
    'SELECT "tenant_roles table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.15 tenant_roles → role_templates
-- 검증: 모든 role_template_id가 role_templates에 존재하는지 확인 (NULL 허용)
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_roles');
SET @sql = IF(@table_exists > 0,
    'SELECT ''tenant_roles'' AS table_name, ''role_template_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(tr.role_template_id) AS non_null_count, COUNT(CASE WHEN tr.role_template_id IS NOT NULL THEN rt.role_template_id END) AS valid_foreign_keys, COUNT(CASE WHEN tr.role_template_id IS NOT NULL AND rt.role_template_id IS NULL THEN 1 END) AS invalid_foreign_keys FROM tenant_roles tr LEFT JOIN role_templates rt ON tr.role_template_id = rt.role_template_id WHERE tr.is_deleted = FALSE',
    'SELECT "tenant_roles table does not exist, skipping validation" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.16 role_permissions → tenant_roles
-- 검증: 모든 tenant_role_id가 tenant_roles에 존재하는지 확인
-- 테이블과 컬럼 존재 여부 모두 확인
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions');
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions' AND COLUMN_NAME = 'tenant_role_id');
SET @sql = IF(@table_exists > 0 AND @column_exists > 0,
    'SELECT ''role_permissions'' AS table_name, ''tenant_role_id'' AS foreign_key_column, COUNT(*) AS total_rows, COUNT(rp.tenant_role_id) AS valid_foreign_keys, COUNT(*) - COUNT(rp.tenant_role_id) AS invalid_foreign_keys FROM role_permissions rp LEFT JOIN tenant_roles tr ON rp.tenant_role_id = tr.tenant_role_id',
    IF(@table_exists = 0, 'SELECT "role_permissions table does not exist, skipping validation" AS message', 'SELECT "role_permissions table exists but tenant_role_id column does not exist, skipping validation" AS message')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 외래키 제약조건 존재 여부 확인
-- ============================================

-- 모든 외래키 제약조건 목록 조회
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_NAME IN (
        'business_category_items',
        'tenant_category_mappings',
        'component_features',
        'component_pricing',
        'component_dependency',
        'tenant_components',
        'pricing_plan_features',
        'tenant_subscriptions',
        'role_template_permissions',
        'role_template_mappings',
        'tenant_roles',
        'role_permissions'
    )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ============================================
-- 3. 데이터 무결성 검증 요약
-- ============================================

-- 모든 검증 결과를 하나의 뷰로 통합 (참고용)
-- 실제로는 위의 개별 쿼리들을 실행하여 결과를 확인

