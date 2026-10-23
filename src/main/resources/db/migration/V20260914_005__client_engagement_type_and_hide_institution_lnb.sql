-- =============================================================================
-- V20260914_005 — 내담자 등록 유형(일반 회기 | 타기관 연계) + 별 LNB 비활성
--
-- 본류는 내담자 등록. 타기관 전용 LNB 화면은 본류가 아니다.
-- 가예약 일지 해킹(#1004) Flyway 미포함. 형제 Flyway(V20260914_001 data-mig) 미머지.
-- 월결제 LIKE 마이그 없음. 결제 주기는 후속. remaining_sessions / 바우처 컬럼 없음.
-- =============================================================================

ALTER TABLE clients
    ADD COLUMN engagement_type VARCHAR(32) NOT NULL DEFAULT 'SESSION_TICKET'
        COMMENT 'SESSION_TICKET=일반 회기, INSTITUTION_LINK=타기관 연계',
    ADD COLUMN institution_name VARCHAR(200) NULL COMMENT '연계 기관명',
    ADD COLUMN institution_contact_name VARCHAR(512) NULL COMMENT '기관 담당자',
    ADD COLUMN institution_contact_phone VARCHAR(512) NULL COMMENT '기관 담당 연락처',
    ADD COLUMN institution_document_phone VARCHAR(512) NULL COMMENT '문서 발송 연락처',
    ADD COLUMN institution_document_email VARCHAR(512) NULL COMMENT '문서 발송 이메일',
    ADD COLUMN institution_prepaid BOOLEAN NULL COMMENT '초기 상담 선납 여부',
    ADD COLUMN institution_prepaid_date DATE NULL COMMENT '초기 선납 일자',
    ADD COLUMN institution_prepaid_amount BIGINT NULL COMMENT '초기 선납 금액(원)';

ALTER TABLE clients
    ADD KEY idx_clients_tenant_engagement (tenant_id, engagement_type);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id,
    created_at, updated_at, created_by, updated_by, is_deleted, version
)
SELECT * FROM (
    SELECT 'CLIENT_ENGAGEMENT_TYPE' AS code_group, 'SESSION_TICKET' AS code_value,
           '일반 회기' AS korean_name, '일반 회기' AS code_label,
           '일반 회기 내담자' AS code_description,
           NULL AS extra_data, 1 AS sort_order, TRUE AS is_active, CAST(NULL AS CHAR) AS tenant_id,
           NOW() AS created_at, NOW() AS updated_at,
           'FLYWAY_V20260914_005' AS created_by, 'FLYWAY_V20260914_005' AS updated_by,
           FALSE AS is_deleted, 0 AS version
    UNION ALL SELECT 'CLIENT_ENGAGEMENT_TYPE', 'INSTITUTION_LINK',
           '타기관 연계', '타기관 연계', '타기관 연계 내담자. 배정 시 INSTITUTION_LINK 게이트',
           NULL, 2, TRUE, NULL, NOW(), NOW(),
           'FLYWAY_V20260914_005', 'FLYWAY_V20260914_005', FALSE, 0
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.tenant_id IS NULL
      AND cc.code_group = seed.code_group
      AND cc.code_value = seed.code_value
      AND cc.is_deleted = FALSE
);

UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_INSTITUTION_LINKS';
