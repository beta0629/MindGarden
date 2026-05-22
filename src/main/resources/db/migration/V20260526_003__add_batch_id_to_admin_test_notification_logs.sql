-- =============================================================================
-- admin_test_notification_logs.batch_id 추가 — 어드민 수동 다중 발송 도구(P1.2)
-- 기획: docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_TOOL_PLAN.md §1.2 P1.2 인벤토리
-- 인벤토리 권장 V20260524_003 → ordering 안전을 위해 V20260526_003 (테이블 생성 V20260526_001 이후) 으로 배치.
--    (out-of-order=true 인 운영/개발은 양쪽 모두 작동, 새 환경은 마이그레이션 ordering 보장 필요)
-- 멱등 적용 — 컬럼·인덱스 모두 존재 여부 가드. DEV·운영에서 한 번 더 실행돼도 안전.
-- =============================================================================

SET @dbname = DATABASE();
SET @tablename = 'admin_test_notification_logs';
SET @columnname = 'batch_id';

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE admin_test_notification_logs ADD COLUMN batch_id VARCHAR(36) NULL COMMENT "수동 발송 배치 그룹 ID(UUID) — 단일 발송은 NULL" AFTER reason',
    'SELECT "batch_id column already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_atnl_tenant_batch'
);
SET @addsql = IF(@idx_exists = 0,
    'ALTER TABLE admin_test_notification_logs ADD INDEX idx_atnl_tenant_batch (tenant_id, batch_id)',
    'SELECT "idx_atnl_tenant_batch already exists"'
);
PREPARE stmt2 FROM @addsql; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
