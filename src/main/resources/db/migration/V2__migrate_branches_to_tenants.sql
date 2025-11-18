-- ============================================
-- Week 0 Day 1: 기존 Branch를 Tenant로 마이그레이션
-- ============================================
-- 목적: 기존 branches 테이블의 데이터를 tenants 테이블로 마이그레이션
-- 작성일: 2025-01-XX
-- ============================================

-- 1. 기존 Branch를 Tenant로 마이그레이션
--    - branch_code를 tenant_id로 사용 (UUID 형식으로 변환 필요 시 별도 처리)
--    - branch_name을 name으로 사용
--    - branch_status를 status로 매핑
--    - business_type은 'CONSULTATION'으로 기본 설정 (기존 MindGarden은 상담 센터)

INSERT INTO tenants (
    tenant_id,
    name,
    business_type,
    status,
    contact_email,
    contact_phone,
    postal_code,
    address,
    address_detail,
    created_at,
    updated_at,
    is_deleted,
    version,
    lang_code,
    created_by,
    updated_by
)
SELECT 
    -- tenant_id 생성: branch_code를 사용하되, UUID 형식이 아니면 변환
    -- 기존 branch_code가 UUID 형식이 아니면 CONCAT('TENANT-', branch_code) 사용
    CASE 
        WHEN branch_code REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN branch_code
        ELSE CONCAT('TENANT-', branch_code)
    END AS tenant_id,
    branch_name AS name,
    'CONSULTATION' AS business_type,  -- 기존 MindGarden은 상담 센터
    -- branch_status를 tenant status로 매핑
    CASE 
        WHEN branch_status = 'ACTIVE' THEN 'ACTIVE'
        WHEN branch_status = 'SUSPENDED' THEN 'SUSPENDED'
        WHEN branch_status = 'CLOSED' THEN 'CLOSED'
        WHEN branch_status = 'PLANNING' THEN 'PENDING'
        WHEN branch_status = 'PREPARING' THEN 'PENDING'
        ELSE 'PENDING'
    END AS status,
    email AS contact_email,
    phone_number AS contact_phone,
    postal_code,
    address,
    address_detail,
    created_at,
    updated_at,
    is_deleted,
    version,
    COALESCE(NULL, 'ko') AS lang_code,  -- branches 테이블에 lang_code가 없을 수 있으므로 NULL 사용
    created_by,
    updated_by
FROM branches
WHERE is_deleted = FALSE
  AND NOT EXISTS (
      -- 이미 마이그레이션된 tenant_id가 있는지 확인
      SELECT 1 FROM tenants t 
      WHERE t.tenant_id = CASE 
          WHEN branches.branch_code REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN branches.branch_code
          ELSE CONCAT('TENANT-', branches.branch_code)
      END
  );

-- 2. branches 테이블에 tenant_id 컬럼 추가 (아직 없을 경우)
--    (V3 마이그레이션에서 처리하지만, 여기서도 확인)
-- MySQL은 ADD COLUMN IF NOT EXISTS를 지원하지 않으므로 동적 SQL 사용
SET @dbname = DATABASE();
SET @tablename = 'branches';
SET @columnname = 'tenant_id';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(36) NULL COMMENT ''테넌트 UUID (tenants.tenant_id 참조)'' AFTER id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. branches 테이블의 tenant_id 업데이트 (마이그레이션된 tenant와 연결)
UPDATE branches b
INNER JOIN tenants t ON (
    t.tenant_id = CASE 
        WHEN b.branch_code REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN b.branch_code
        ELSE CONCAT('TENANT-', b.branch_code)
    END
)
SET b.tenant_id = t.tenant_id
WHERE b.tenant_id IS NULL
  AND b.is_deleted = FALSE;

-- 4. 마이그레이션 결과 확인용 로그 (선택적)
--    실제 운영에서는 이 부분을 제거하거나 로그 테이블에 기록
-- SELECT 
--     COUNT(*) AS migrated_tenants,
--     COUNT(DISTINCT b.tenant_id) AS branches_with_tenant
-- FROM tenants t
-- LEFT JOIN branches b ON b.tenant_id = t.tenant_id;

