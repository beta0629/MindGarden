-- shop_client_orders — 내담자 fulfill-retry 성공 1회 소진 플래그
-- @author MindGarden
-- @since 2026-09-19
-- @revised 2026-09-23 — DELIMITER $$ 저장 프로시저를 PREPARE/EXECUTE 패턴으로 교체
--   이유: Flyway 9.22.3 + MySQL 8 일부 환경에서 DELIMITER 구문이 SQLSyntaxErrorException
--         을 유발하여 migration 이 FAILED 상태로 남는 문제 재현.
--   validate-on-migrate=false 이므로 체크섬 변경이 기존 환경 배포를 차단하지 않는다.
--
-- 멱등: INFORMATION_SCHEMA 확인 후 컬럼 없을 때만 ALTER TABLE 실행.
--       AFTER 절 없음 — checkout_idempotency_key 위치와 무관.
-- =============================================================================

SET @_dbname = DATABASE();

SET @_stmt = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @_dbname
           AND TABLE_NAME   = 'shop_client_orders'
           AND COLUMN_NAME  = 'client_fulfill_retry_attempted') > 0,
        'SELECT 1',
        'ALTER TABLE shop_client_orders ADD COLUMN client_fulfill_retry_attempted TINYINT(1) NOT NULL DEFAULT 0'
    )
);
PREPARE _s FROM @_stmt;
EXECUTE _s;
DEALLOCATE PREPARE _s;
