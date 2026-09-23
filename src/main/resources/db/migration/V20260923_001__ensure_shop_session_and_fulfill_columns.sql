-- =============================================================================
-- V20260923_001 — shop 테이블 누락 컬럼 최종 보장 (P0 checkout 500 해결)
--
-- 배경:
--   • V20260917_001 (PREPARE/EXECUTE) — session_count / session_count_snapshot 추가
--     시도했으나 Flyway 9.22.3 + MySQL 8 환경에서 DDL 이 실행되지 않고
--     migration history 에 SUCCESS 로만 기록되는 silent-fail 이 재현됨.
--   • V20260919_001/002 (DELIMITER $$ 저장 프로시저) — 이전 마이그레이션 보완 시도.
--     일부 .dev 배포 환경에서 DELIMITER 구문 파싱 오류(SQLSyntaxErrorException)로
--     FAILED 상태가 되면 Flyway 가 자동 재실행하지 않아 컬럼이 여전히 누락 가능.
--
-- 본 파일은 PREPARE/EXECUTE 만 사용하며 DELIMITER 키워드 없이 멱등 체크 후 ALTER:
--   • 컬럼 존재 확인 → 없을 때만 ALTER TABLE — 재실행 안전
--   • AFTER 절 없음 — 선행 컬럼 순서와 무관
--   • 한글 주석 포함 SQL 문자열 제거 — Korean chars 변수 인코딩 오류 방지
--
-- 수정 대상:
--   1. shop_catalog_skus.session_count          (결제 PAID 시 매핑 가산 회기수)
--   2. shop_client_order_lines.session_count_snapshot  (결제 시점 SKU 회기수 스냅샷)
--   3. shop_client_orders.client_fulfill_retry_attempted (내담자 fulfill-retry 1회 소진)
--
-- 엔티티 정합:
--   ShopCatalogSku.sessionCount         INT NOT NULL DEFAULT 1
--   ShopClientOrderLine.sessionCountSnapshot  INT NULL
--   ShopClientOrder.clientFulfillRetryAttempted  TINYINT(1) NOT NULL DEFAULT 0
--
-- @author MindGarden
-- @since 2026-09-23
-- =============================================================================

SET @dbname = DATABASE();

-- ---------------------------------------------------------------------------
-- 1. shop_catalog_skus.session_count
-- ---------------------------------------------------------------------------
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME   = 'shop_catalog_skus'
           AND COLUMN_NAME  = 'session_count') > 0,
        'SELECT 1 /* session_count already exists */',
        'ALTER TABLE shop_catalog_skus ADD COLUMN session_count INT NOT NULL DEFAULT 1'
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. shop_client_order_lines.session_count_snapshot
-- ---------------------------------------------------------------------------
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME   = 'shop_client_order_lines'
           AND COLUMN_NAME  = 'session_count_snapshot') > 0,
        'SELECT 1 /* session_count_snapshot already exists */',
        'ALTER TABLE shop_client_order_lines ADD COLUMN session_count_snapshot INT NULL'
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 3. shop_client_orders.client_fulfill_retry_attempted
-- ---------------------------------------------------------------------------
SET @preparedStatement = (
    SELECT IF(
        (SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME   = 'shop_client_orders'
           AND COLUMN_NAME  = 'client_fulfill_retry_attempted') > 0,
        'SELECT 1 /* client_fulfill_retry_attempted already exists */',
        'ALTER TABLE shop_client_orders ADD COLUMN client_fulfill_retry_attempted TINYINT(1) NOT NULL DEFAULT 0'
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
