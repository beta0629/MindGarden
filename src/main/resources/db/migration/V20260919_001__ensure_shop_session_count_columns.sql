-- shop/cart 500 hotfix — session_count / session_count_snapshot 컬럼 보장
-- @author MindGarden
-- @since 2026-09-19
-- @revised 2026-09-23 — DELIMITER $$ 저장 프로시저를 PREPARE/EXECUTE 패턴으로 교체
--   이유: Flyway 9.22.3 + MySQL 8 일부 환경에서 DELIMITER 구문이 SQLSyntaxErrorException
--         을 유발하여 migration 이 FAILED 상태로 남고 Flyway 가 이후 기동 시 재실행하지
--         않아 컬럼이 여전히 누락되는 문제 재현.
--   validate-on-migrate=false 이므로 체크섬 변경이 기존 환경 배포를 차단하지 않는다.
--
-- 멱등: INFORMATION_SCHEMA 확인 후 컬럼 없을 때만 ALTER TABLE 실행.
--       AFTER 절 없음 — 선행 컬럼 순서와 무관.
-- =============================================================================

SET @_dbname = DATABASE();

-- 1. shop_catalog_skus.session_count
SET @_stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @_dbname
           AND TABLE_NAME   = 'shop_catalog_skus'
           AND COLUMN_NAME  = 'session_count') > 0,
        'SELECT 1',
        'ALTER TABLE shop_catalog_skus ADD COLUMN session_count INT NOT NULL DEFAULT 1'
    )
);
PREPARE _s FROM @_stmt;
EXECUTE _s;
DEALLOCATE PREPARE _s;

-- 2. shop_client_order_lines.session_count_snapshot
SET @_stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @_dbname
           AND TABLE_NAME   = 'shop_client_order_lines'
           AND COLUMN_NAME  = 'session_count_snapshot') > 0,
        'SELECT 1',
        'ALTER TABLE shop_client_order_lines ADD COLUMN session_count_snapshot INT NULL'
    )
);
PREPARE _s FROM @_stmt;
EXECUTE _s;
DEALLOCATE PREPARE _s;
