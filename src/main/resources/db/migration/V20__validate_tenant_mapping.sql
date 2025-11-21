-- ============================================
-- Phase 1 Week 2 Day 1-2: 기존 데이터 테넌트 매핑 검증
-- ============================================
-- 목적: 기존 데이터의 tenant_id 매핑 상태 검증 및 누락된 데이터 보완
-- 작성일: 2025-11-18
-- ============================================

-- ============================================
-- 1. Branch → Tenant 매핑 검증
-- ============================================

-- tenant_id가 NULL인 branches 확인
SELECT 
    'branches' AS table_name,
    COUNT(*) AS null_tenant_id_count,
    (SELECT GROUP_CONCAT(id ORDER BY id SEPARATOR ',') 
     FROM (SELECT id FROM branches WHERE tenant_id IS NULL AND is_deleted = FALSE LIMIT 10) AS sub) AS sample_ids
FROM branches
WHERE tenant_id IS NULL
  AND is_deleted = FALSE;

-- ============================================
-- 2. 주요 엔티티의 tenant_id 매핑 검증
-- ============================================

-- users 테이블 검증
SELECT 
    'users' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM users
WHERE is_deleted = FALSE;

-- consultations 테이블 검증
SELECT 
    'consultations' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM consultations
WHERE is_deleted = FALSE;

-- payments 테이블 검증
SELECT 
    'payments' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM payments
WHERE is_deleted = FALSE;

-- schedules 테이블 검증
SELECT 
    'schedules' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM schedules
WHERE is_deleted = FALSE;

-- consultants 테이블 검증
SELECT 
    'consultants' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM consultants
WHERE is_deleted = FALSE;

-- clients 테이블 검증
SELECT 
    'clients' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count
FROM clients
WHERE is_deleted = FALSE;

-- ============================================
-- 3. 누락된 tenant_id 보완 (Branch 기반)
-- ============================================

-- users 테이블 보완
UPDATE users u
INNER JOIN branches b ON u.branch_id = b.id
SET u.tenant_id = b.tenant_id
WHERE u.tenant_id IS NULL
  AND b.tenant_id IS NOT NULL
  AND u.is_deleted = FALSE;

-- consultations 테이블 보완 (branch_id가 있는 경우)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'consultations' 
    AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE consultations c 
     INNER JOIN branches b ON c.branch_id = b.id 
     SET c.tenant_id = b.tenant_id 
     WHERE c.tenant_id IS NULL 
       AND b.tenant_id IS NOT NULL 
       AND c.is_deleted = FALSE',
    'SELECT "consultations table does not have branch_id column, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payments 테이블 보완 (branch_id가 있는 경우)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'payments' 
    AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE payments p 
     INNER JOIN branches b ON p.branch_id = b.id 
     SET p.tenant_id = b.tenant_id 
     WHERE p.tenant_id IS NULL 
       AND b.tenant_id IS NOT NULL 
       AND p.is_deleted = FALSE',
    'SELECT "payments table does not have branch_id column, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- schedules 테이블 보완 (branch_id가 있는 경우)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'schedules' 
    AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE schedules s 
     INNER JOIN branches b ON s.branch_id = b.id 
     SET s.tenant_id = b.tenant_id 
     WHERE s.tenant_id IS NULL 
       AND b.tenant_id IS NOT NULL 
       AND s.is_deleted = FALSE',
    'SELECT "schedules table does not have branch_id column, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- consultants 테이블 보완 (branch_id가 있는 경우)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'consultants' 
    AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE consultants co 
     INNER JOIN branches b ON co.branch_id = b.id 
     SET co.tenant_id = b.tenant_id 
     WHERE co.tenant_id IS NULL 
       AND b.tenant_id IS NOT NULL 
       AND co.is_deleted = FALSE',
    'SELECT "consultants table does not have branch_id column, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clients 테이블 보완 (branch_id가 있는 경우)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'clients' 
    AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE clients cl 
     INNER JOIN branches b ON cl.branch_id = b.id 
     SET cl.tenant_id = b.tenant_id 
     WHERE cl.tenant_id IS NULL 
       AND b.tenant_id IS NOT NULL 
       AND cl.is_deleted = FALSE',
    'SELECT "clients table does not have branch_id column, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. 최종 검증 리포트
-- ============================================

-- 전체 테이블별 tenant_id 매핑 상태 리포트
SELECT 
    'branches' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM branches
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'users' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM users
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'consultations' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM consultations
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'payments' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM payments
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'schedules' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM schedules
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'consultants' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM consultants
WHERE is_deleted = FALSE

UNION ALL

SELECT 
    'clients' AS table_name,
    COUNT(*) AS total_count,
    COUNT(tenant_id) AS with_tenant_id,
    COUNT(*) - COUNT(tenant_id) AS null_tenant_id_count,
    ROUND(COUNT(tenant_id) * 100.0 / COUNT(*), 2) AS mapping_percentage
FROM clients
WHERE is_deleted = FALSE

ORDER BY table_name;

