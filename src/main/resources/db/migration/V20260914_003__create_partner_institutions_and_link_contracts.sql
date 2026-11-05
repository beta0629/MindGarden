-- =============================================================================
-- V20260914_003 — 연계 기관 마스터 + 타기관 연계 계약
--
-- 형제 일지 마이그 V20260914_002 를 건너뛰지 않음 (본 파일은 003).
-- 회기권 consultant_client_mappings 에 쓰지 않음. remaining_sessions 컬럼 없음.
-- 월말 상담내역 문서 생성기 풀구현 없음 — 기관 수신 필드만.
-- =============================================================================

CREATE TABLE IF NOT EXISTS partner_institutions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id           VARCHAR(36)     NOT NULL,
    name                VARCHAR(200)   NOT NULL COMMENT '기관명',
    contact_name        VARCHAR(100)   NOT NULL COMMENT '담당자',
    contact_phone       VARCHAR(50)    NULL COMMENT '연락처',
    document_email      VARCHAR(255)   NOT NULL COMMENT '월말 문서 수신 이메일',
    notes               TEXT           NULL,
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at          DATETIME(6)     NULL,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    version             BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_pi_tenant_deleted (tenant_id, is_deleted),
    KEY idx_pi_tenant_name (tenant_id, name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='연계 기관 마스터 (월말 문서 수신처)';

CREATE TABLE IF NOT EXISTS institution_link_contracts (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id           VARCHAR(36)     NOT NULL,
    client_id           BIGINT          NOT NULL COMMENT '내담자 users.id = clients.id',
    institution_id      BIGINT          NOT NULL COMMENT 'partner_institutions.id',
    consultant_id      BIGINT          NULL COMMENT '선택. 회기 매핑 아님',
    period_start        DATE            NOT NULL COMMENT '월결제 시작일',
    period_end          DATE            NULL,
    prepaid_amount      BIGINT          NOT NULL COMMENT '초기 선납 금액(원)',
    prepaid_at          DATETIME(6)    NULL,
    monthly_amount      BIGINT          NOT NULL COMMENT '월결제 금액(원)',
    status              VARCHAR(50)    NOT NULL COMMENT 'INSTITUTION_LINK_CONTRACT_STATUS',
    notes               TEXT           NULL,
    source_mapping_id   BIGINT          NULL COMMENT '회기 매핑 추적(신규 등록은 NULL)',
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at          DATETIME(6)     NULL,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    version             BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilc_tenant_id (tenant_id),
    KEY idx_ilc_tenant_client (tenant_id, client_id),
    KEY idx_ilc_tenant_institution (tenant_id, institution_id),
    KEY idx_ilc_tenant_status (tenant_id, status),
    CONSTRAINT fk_ilc_partner_institution
        FOREIGN KEY (institution_id) REFERENCES partner_institutions (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 등록 (회기권 매핑과 분리, 잔여회기 없음)';

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    sort_order, is_active, tenant_id,
    created_at, updated_at, is_deleted, version
)
SELECT * FROM (
    SELECT 'INSTITUTION_LINK_CONTRACT_STATUS' AS code_group, 'ACTIVE' AS code_value,
           '진행' AS korean_name, '진행' AS code_label, '타기관 월연계 진행' AS code_description,
           1 AS sort_order, TRUE AS is_active, CAST(NULL AS CHAR) AS tenant_id,
           NOW() AS created_at, NOW() AS updated_at,
           FALSE AS is_deleted, 0 AS version
    UNION ALL SELECT 'INSTITUTION_LINK_CONTRACT_STATUS', 'PREPAID',
           '선납', '선납', '초기 상담 선납',
           2, TRUE, NULL, NOW(), NOW(), FALSE, 0
    UNION ALL SELECT 'INSTITUTION_LINK_CONTRACT_STATUS', 'ENDED',
           '종료', '종료', '타기관 월연계 종료',
           3, TRUE, NULL, NOW(), NOW(), FALSE, 0
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.tenant_id IS NULL
      AND cc.code_group = seed.code_group
      AND cc.code_value = seed.code_value
      AND cc.is_deleted = FALSE
);
