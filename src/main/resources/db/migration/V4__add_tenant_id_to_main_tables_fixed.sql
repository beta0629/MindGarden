-- ============================================
-- Week 0 Day 2: 주요 테이블에 tenant_id 컬럼 추가 (수정 버전)
-- ============================================
-- 목적: 주요 엔티티 테이블에 tenant_id 추가 (Hibernate 호환성 고려)
-- 작성일: 2025-01-XX
-- 전략: 점진적 추가 - 우선 주요 테이블만, 나머지는 점진적으로 확장
-- ============================================

-- 공통 변수 설정
SET @dbname = DATABASE();

-- ============================================
-- 공통 함수: 테이블에 컬럼 추가 (동적)
-- ============================================
-- 사용법: CALL add_column_if_not_exists('table_name', 'column_name', 'column_definition', 'after_column');

DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT,
    IN p_after_column VARCHAR(64)
)
BEGIN
    DECLARE v_column_exists INT DEFAULT 0;
    DECLARE v_after_column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;
    
    IF v_column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_definition);
        IF p_after_column IS NOT NULL AND p_after_column != '' THEN
            -- AFTER 컬럼이 존재하는지 확인
            SELECT COUNT(*) INTO v_after_column_exists
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = p_table_name
              AND COLUMN_NAME = p_after_column;
            
            IF v_after_column_exists > 0 THEN
                SET @sql = CONCAT(@sql, ' AFTER ', p_after_column);
            END IF;
        END IF;
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- ============================================
-- 1. users 테이블
-- ============================================
CALL add_column_if_not_exists('users', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID (tenants.tenant_id 참조)''', 'id');
CALL add_column_if_not_exists('users', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('users', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('users', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

-- 인덱스 생성 (이미 존재하면 스킵)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_users_tenant_id ON users(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_users_tenant_branch ON users(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. consultations 테이블
-- ============================================
CALL add_column_if_not_exists('consultations', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('consultations', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('consultations', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('consultations', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND INDEX_NAME = 'idx_consultations_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_consultations_tenant_id ON consultations(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND INDEX_NAME = 'idx_consultations_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_consultations_tenant_branch ON consultations(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. payments 테이블
-- ============================================
CALL add_column_if_not_exists('payments', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('payments', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('payments', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('payments', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'idx_payments_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_payments_tenant_id ON payments(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'idx_payments_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_payments_tenant_branch ON payments(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. schedules 테이블
-- ============================================
CALL add_column_if_not_exists('schedules', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('schedules', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('schedules', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('schedules', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND INDEX_NAME = 'idx_schedules_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_schedules_tenant_id ON schedules(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND INDEX_NAME = 'idx_schedules_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_schedules_tenant_branch ON schedules(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. financial_transactions 테이블
-- ============================================
CALL add_column_if_not_exists('financial_transactions', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('financial_transactions', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('financial_transactions', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('financial_transactions', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_transactions' AND INDEX_NAME = 'idx_financial_transactions_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_financial_transactions_tenant_id ON financial_transactions(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_transactions' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_transactions' AND INDEX_NAME = 'idx_financial_transactions_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_financial_transactions_tenant_branch ON financial_transactions(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. consultation_records 테이블
-- ============================================
CALL add_column_if_not_exists('consultation_records', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('consultation_records', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('consultation_records', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('consultation_records', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_records' AND INDEX_NAME = 'idx_consultation_records_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_consultation_records_tenant_id ON consultation_records(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_records' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_records' AND INDEX_NAME = 'idx_consultation_records_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_consultation_records_tenant_branch ON consultation_records(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. clients 테이블
-- ============================================
CALL add_column_if_not_exists('clients', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('clients', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('clients', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('clients', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND INDEX_NAME = 'idx_clients_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_clients_tenant_id ON clients(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND INDEX_NAME = 'idx_clients_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_clients_tenant_branch ON clients(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 8. consultants 테이블
-- ============================================
CALL add_column_if_not_exists('consultants', 'tenant_id', 'VARCHAR(36) NULL COMMENT ''테넌트 UUID''', 'id');
CALL add_column_if_not_exists('consultants', 'lang_code', 'VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드''', 'updated_at');
CALL add_column_if_not_exists('consultants', 'created_by', 'VARCHAR(100) NULL COMMENT ''생성자''', 'created_at');
CALL add_column_if_not_exists('consultants', 'updated_by', 'VARCHAR(100) NULL COMMENT ''수정자''', 'updated_at');

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants' AND INDEX_NAME = 'idx_consultants_tenant_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_consultants_tenant_id ON consultants(tenant_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants' AND COLUMN_NAME = 'branch_id');
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants' AND INDEX_NAME = 'idx_consultants_tenant_branch');
SET @sql = IF(@col_exists > 0 AND @idx_exists = 0, 'CREATE INDEX idx_consultants_tenant_branch ON consultants(tenant_id, branch_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 9. 기존 데이터에 tenant_id 설정
-- ============================================

-- users 테이블 업데이트
UPDATE users u
INNER JOIN branches b ON u.branch_id = b.id
SET u.tenant_id = b.tenant_id
WHERE u.tenant_id IS NULL
  AND b.tenant_id IS NOT NULL
  AND u.is_deleted = FALSE;

-- consultations 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE consultations c INNER JOIN branches b ON c.branch_id = b.id SET c.tenant_id = b.tenant_id WHERE c.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND c.is_deleted = FALSE',
    'SELECT "consultations table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payments 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE payments p INNER JOIN branches b ON p.branch_id = b.id SET p.tenant_id = b.tenant_id WHERE p.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND p.is_deleted = FALSE',
    'SELECT "payments table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- schedules 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE schedules s INNER JOIN branches b ON s.branch_id = b.id SET s.tenant_id = b.tenant_id WHERE s.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND s.is_deleted = FALSE',
    'SELECT "schedules table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- financial_transactions 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_transactions' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE financial_transactions ft INNER JOIN branches b ON ft.branch_id = b.id SET ft.tenant_id = b.tenant_id WHERE ft.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND ft.is_deleted = FALSE',
    'SELECT "financial_transactions table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- consultation_records 테이블 업데이트 (consultations.branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE consultation_records cr INNER JOIN consultations c ON cr.consultation_id = c.id INNER JOIN branches b ON c.branch_id = b.id SET cr.tenant_id = b.tenant_id WHERE cr.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND cr.is_deleted = FALSE',
    'SELECT "consultations table does not have branch_id column, skipping consultation_records tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clients 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE clients cl INNER JOIN branches b ON cl.branch_id = b.id SET cl.tenant_id = b.tenant_id WHERE cl.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND cl.is_deleted = FALSE',
    'SELECT "clients table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- consultants 테이블 업데이트 (branch_id가 있는 경우만)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants' AND COLUMN_NAME = 'branch_id');
SET @sql = IF(@col_exists > 0,
    'UPDATE consultants co INNER JOIN branches b ON co.branch_id = b.id SET co.tenant_id = b.tenant_id WHERE co.tenant_id IS NULL AND b.tenant_id IS NOT NULL AND co.is_deleted = FALSE',
    'SELECT "consultants table does not have branch_id column, skipping tenant_id update" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 프로시저 정리
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

