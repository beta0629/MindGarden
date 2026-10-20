-- =============================================================================
-- V20261015_004 — tenant_pg_configurations 재승인용 pending edit 스냅샷
--
-- 목적:
--   ACTIVE 운영 PG 설정의 ADMIN 수정을 live 컬럼에 즉시 반영하지 않고
--   pending_request_json 에 스테이징한다. Ops 승인 시에만 live 적용,
--   거부 시 pending 폐기. 결제 조회는 기존 APPROVED live 값을 유지한다.
--
-- 정책: DELETE 금지. 멱등(INFORMATION_SCHEMA 가드). 재실행 NO-OP.
-- 참고: V20261014_001 은 shop_client_offers 에 사용됨 → 본 마이그레이션은 004.
-- =============================================================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_pg_configurations'
      AND COLUMN_NAME = 'pending_request_json');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenant_pg_configurations ADD COLUMN pending_request_json JSON NULL COMMENT ''ADMIN 스테이징 수정 스냅샷(암호화 키 포함, testMode 제외)''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_pg_configurations'
      AND COLUMN_NAME = 'pending_requested_by');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenant_pg_configurations ADD COLUMN pending_requested_by VARCHAR(100) NULL COMMENT ''pending 수정 요청자''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tenant_pg_configurations'
      AND COLUMN_NAME = 'pending_requested_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenant_pg_configurations ADD COLUMN pending_requested_at TIMESTAMP NULL COMMENT ''pending 수정 요청 시각''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
