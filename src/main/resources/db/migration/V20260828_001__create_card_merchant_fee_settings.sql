-- =============================================================================
-- V20260828_001__create_card_merchant_fee_settings.sql
-- 카드 가맹점 수수료 설정 및 financial_transactions 결제 수단 컬럼
--
-- 운영 영향: 신규 테이블 2건, financial_transactions 컬럼 2건 추가.
-- 요율 시드 없음 — 테넌트별 설정 UI에서만 입력.
-- =============================================================================

CREATE TABLE IF NOT EXISTS card_merchant_fee_settings (
    id                    BIGINT         NOT NULL AUTO_INCREMENT,
    tenant_id             VARCHAR(36)    NOT NULL,
    average_rate_percent  DECIMAL(5, 2)  NULL     COMMENT '평균 요율(%). 카드사 미지정 시 사용',
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at            DATETIME(6)    NULL,
    is_deleted            BOOLEAN        NOT NULL DEFAULT FALSE,
    version               BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cmfs_tenant_id (tenant_id),
    KEY idx_cmfs_tenant_id (tenant_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='카드 가맹점 수수료 설정 (테넌트당 1건)';

CREATE TABLE IF NOT EXISTS card_merchant_fee_issuer_rates (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    tenant_id       VARCHAR(36)    NOT NULL,
    settings_id     BIGINT         NOT NULL,
    issuer_label    VARCHAR(50)    NOT NULL COMMENT '카드사 표시명',
    rate_percent    DECIMAL(5, 2)  NULL     COMMENT '카드사별 요율(%)',
    sort_order      INT            NOT NULL DEFAULT 0,
    created_at      DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at      DATETIME(6)    NULL,
    is_deleted      BOOLEAN        NOT NULL DEFAULT FALSE,
    version         BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_cmfir_tenant_settings (tenant_id, settings_id),
    KEY idx_cmfir_settings_sort (settings_id, sort_order),
    CONSTRAINT fk_cmfir_settings FOREIGN KEY (settings_id)
        REFERENCES card_merchant_fee_settings (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='카드사별 수수료 요율 (선택적 override)';

ALTER TABLE financial_transactions
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NULL COMMENT '결제 수단 (CARD, CASH, BANK_TRANSFER 등)',
    ADD COLUMN IF NOT EXISTS card_issuer VARCHAR(50) NULL COMMENT '카드사 (수수료 재계산용)';
