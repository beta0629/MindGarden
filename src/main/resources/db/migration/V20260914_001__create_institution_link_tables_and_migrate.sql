-- =============================================================================
-- V20260914_001 — 타기관 연계 별 저장소 분리 (Flyway)
--
-- 목적: 타기관 연계를 회기권 매핑/일지 테이블의 플래그로 두지 않고 별 테이블로 분리.
--       기간은 고정 월 단위가 아니다. 월결제는 추후. 바우처 테이블·마이그 없음.
--
-- 신규 테이블:
--   institution_link_contracts           타기관 계약/매핑 (기간 optional, 선납 optional)
--   institution_link_schedule_links     기존 schedules 연결 (캘린더 occupancy 유지)
--   institution_link_consultation_logs   타기관 상담일지 (회기 일지와 오류 격리)
--
-- 데이터 이전 식별 (과매칭 금지):
--   • LIKE 마커: 타기관 / 기관연계 / 기관 연계 만
--   • 또는 payment_timing = 'INSTITUTION_LINK' (후속 값, 현재 회기권에는 없음)
--   • 월결제 / 월계약 만으로 회기 매핑을 긁지 않음
--   tenant_id 필수. source_mapping_id / source_record_id 로 멱등.
--   운영 서버 수동 UPDATE 금지. 이 스크립트만 사용.
--
-- 이전하지 않음:
--   • 마커 없는 회기권 매핑·그 일정·그 상담일지
--   • 월결제 / 월계약 문구만 있는 회기권 매핑
--   • 암호화된 users.name 만으로 식별되는 내담자(최가을 등) — 이름 LIKE 금지
--   • remaining_sessions / used_sessions / total_sessions (회기권 SSOT 유지)
--   • 바우처 도메인 (실데이터 없음, 타기관 이후)
--   • consultation_record_drafts / consultation_record_alerts
--   • schedules 본체 행 (슬롯 점유는 기존 일정 테이블)
--
-- 이전 후: 해당 회기 매핑·일지는 소프트삭제. 일정 mapping_id 만 NULL (회기 차감 차단).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DDL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institution_link_contracts (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id           VARCHAR(36)    NOT NULL,
    consultant_id       BIGINT          NOT NULL,
    client_id           BIGINT          NOT NULL,
    period_start        DATE            NULL COMMENT '연계 기간 시작 (optional, 월 고정 아님)',
    period_end          DATE            NULL COMMENT '연계 기간 종료 (optional)',
    prepaid_amount     BIGINT          NULL COMMENT '선납 금액 (optional)',
    prepaid_at          DATETIME(6)    NULL COMMENT '선납 시각',
    monthly_amount      BIGINT          NULL COMMENT '월 결제 금액 (추후, 현재 미이전)',
    status              VARCHAR(50)    NOT NULL COMMENT 'INSTITUTION_LINK_CONTRACT_STATUS',
    institution_name    VARCHAR(200)   NULL COMMENT '연계 기관명',
    notes               TEXT           NULL,
    source_mapping_id  BIGINT          NULL COMMENT 'consultant_client_mappings.id 추적',
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at          DATETIME(6)    NULL,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    version             BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilc_tenant_id (tenant_id),
    KEY idx_ilc_tenant_client (tenant_id, client_id),
    KEY idx_ilc_tenant_consultant (tenant_id, consultant_id),
    KEY idx_ilc_tenant_period (tenant_id, period_start, period_end),
    KEY idx_ilc_tenant_status (tenant_id, status),
    UNIQUE KEY uk_ilc_tenant_source_mapping (tenant_id, source_mapping_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 계약. 기간 optional, 월결제 추후. 회기권 매핑과 분리';

CREATE TABLE IF NOT EXISTS institution_link_schedule_links (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id       VARCHAR(36)     NOT NULL,
    contract_id     BIGINT          NOT NULL,
    schedule_id     BIGINT          NOT NULL COMMENT 'schedules.id',
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at      DATETIME(6)     NULL,
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    version         BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilsl_tenant_contract (tenant_id, contract_id),
    UNIQUE KEY uk_ilsl_tenant_schedule (tenant_id, schedule_id),
    CONSTRAINT fk_ilsl_contract
        FOREIGN KEY (contract_id) REFERENCES institution_link_contracts (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 일정 연결 (schedules 본체는 유지)';

CREATE TABLE IF NOT EXISTS institution_link_consultation_logs (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id               VARCHAR(36)     NOT NULL,
    contract_id             BIGINT          NOT NULL,
    schedule_id             BIGINT          NULL COMMENT 'schedules.id',
    client_id               BIGINT          NOT NULL,
    consultant_id           BIGINT          NOT NULL,
    session_date            DATE            NOT NULL,
    session_number          INT             NULL COMMENT '회기권 remaining_sessions 와 무관',
    client_condition         TEXT           NULL,
    main_issues             TEXT           NULL,
    intervention_methods    TEXT           NULL,
    client_response         TEXT           NULL,
    next_session_plan      TEXT           NULL,
    homework_assigned       TEXT           NULL,
    consultant_observations  TEXT           NULL,
    consultant_assessment   TEXT           NULL,
    progress_evaluation     TEXT           NULL,
    special_considerations   TEXT           NULL,
    is_session_completed     BOOLEAN         NULL,
    source_record_id       BIGINT          NULL COMMENT 'consultation_records.id 추적',
    created_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at              DATETIME(6)     NULL,
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    version                 BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilcl_tenant_contract (tenant_id, contract_id),
    KEY idx_ilcl_tenant_client (tenant_id, client_id),
    KEY idx_ilcl_tenant_session_date (tenant_id, session_date),
    UNIQUE KEY uk_ilcl_tenant_source_record (tenant_id, source_record_id),
    CONSTRAINT fk_ilcl_contract
        FOREIGN KEY (contract_id) REFERENCES institution_link_contracts (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 상담일지. remaining_sessions 없음';

-- -----------------------------------------------------------------------------
-- 2. 공통코드 시드 (상태·식별 마커). tenant_id NULL = 코어. 멱등.
-- -----------------------------------------------------------------------------
INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id,
    created_at, updated_at, created_by, updated_by, is_deleted, version
)
SELECT * FROM (
    SELECT 'INSTITUTION_LINK_CONTRACT_STATUS' AS code_group, 'ACTIVE' AS code_value,
           '진행' AS korean_name, '진행' AS code_label, '타기관 연계 진행' AS code_description,
           NULL AS extra_data, 1 AS sort_order, TRUE AS is_active, NULL AS tenant_id,
           NOW() AS created_at, NOW() AS updated_at,
           'FLYWAY_V20260914_001' AS created_by, 'FLYWAY_V20260914_001' AS updated_by,
           FALSE AS is_deleted, 0 AS version
    UNION ALL SELECT 'INSTITUTION_LINK_CONTRACT_STATUS', 'PREPAID',
           '선납', '선납', '초기 상담 선납',
           NULL, 2, TRUE, NULL, NOW(), NOW(), 'FLYWAY_V20260914_001', 'FLYWAY_V20260914_001', FALSE, 0
    UNION ALL SELECT 'INSTITUTION_LINK_CONTRACT_STATUS', 'ENDED',
           '종료', '종료', '타기관 연계 종료',
           NULL, 3, TRUE, NULL, NOW(), NOW(), 'FLYWAY_V20260914_001', 'FLYWAY_V20260914_001', FALSE, 0
    UNION ALL SELECT 'INSTITUTION_LINK_MIG_MARKER', '타기관',
           '타기관', '타기관', '타기관 연계 매핑 식별 마커',
           NULL, 1, TRUE, NULL, NOW(), NOW(), 'FLYWAY_V20260914_001', 'FLYWAY_V20260914_001', FALSE, 0
    UNION ALL SELECT 'INSTITUTION_LINK_MIG_MARKER', '기관연계',
           '기관연계', '기관연계', '타기관 연계 매핑 식별 마커',
           NULL, 2, TRUE, NULL, NOW(), NOW(), 'FLYWAY_V20260914_001', 'FLYWAY_V20260914_001', FALSE, 0
    UNION ALL SELECT 'INSTITUTION_LINK_MIG_MARKER', '기관 연계',
           '기관 연계', '기관 연계', '타기관 연계 매핑 식별 마커',
           NULL, 3, TRUE, NULL, NOW(), NOW(), 'FLYWAY_V20260914_001', 'FLYWAY_V20260914_001', FALSE, 0
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.tenant_id IS NULL
      AND cc.code_group = seed.code_group
      AND cc.code_value = seed.code_value
      AND cc.is_deleted = FALSE
);

-- -----------------------------------------------------------------------------
-- 3. 계약 복사 (타기관/기관연계 마커 또는 payment_timing=INSTITUTION_LINK).
--    remaining_sessions 복사 금지. 월 말일(LAST_DAY) 채우지 않음. monthly_amount 미이전.
-- -----------------------------------------------------------------------------
INSERT INTO institution_link_contracts (
    tenant_id, consultant_id, client_id,
    period_start, period_end,
    prepaid_amount, prepaid_at, monthly_amount,
    status, institution_name, notes, source_mapping_id,
    created_at, updated_at, deleted_at, is_deleted, version
)
SELECT
    m.tenant_id,
    m.consultant_id,
    m.client_id,
    CASE WHEN m.start_date IS NOT NULL THEN DATE(m.start_date) ELSE NULL END,
    CASE WHEN m.end_date IS NOT NULL THEN DATE(m.end_date) ELSE NULL END,
    COALESCE(m.payment_amount, m.final_amount, m.package_price),
    m.payment_date,
    NULL,
    CASE
        WHEN m.status IN ('ACTIVE', 'PAYMENT_CONFIRMED', 'DEPOSIT_CONFIRMED') THEN 'ACTIVE'
        WHEN m.status IN ('PENDING_PAYMENT', 'DEPOSIT_PENDING') THEN 'PREPAID'
        ELSE 'ENDED'
    END,
    NULL,
    m.notes,
    m.id,
    COALESCE(m.created_at, CURRENT_TIMESTAMP(6)),
    COALESCE(m.updated_at, CURRENT_TIMESTAMP(6)),
    NULL,
    FALSE,
    0
FROM consultant_client_mappings m
WHERE m.tenant_id IS NOT NULL
  AND m.tenant_id <> ''
  AND m.consultant_id IS NOT NULL
  AND m.client_id IS NOT NULL
  AND (m.is_deleted = FALSE OR m.is_deleted IS NULL)
  AND (
      m.payment_timing = 'INSTITUTION_LINK'
      OR EXISTS (
          SELECT 1
          FROM common_codes cc
          WHERE cc.code_group = 'INSTITUTION_LINK_MIG_MARKER'
            AND cc.is_deleted = FALSE
            AND cc.is_active = TRUE
            AND (cc.tenant_id IS NULL OR cc.tenant_id = m.tenant_id)
            AND (
                IFNULL(m.package_name, '') LIKE CONCAT('%', cc.code_value, '%')
                OR IFNULL(m.notes, '') LIKE CONCAT('%', cc.code_value, '%')
                OR IFNULL(m.special_considerations, '') LIKE CONCAT('%', cc.code_value, '%')
                OR IFNULL(m.responsibility, '') LIKE CONCAT('%', cc.code_value, '%')
            )
      )
  )
  AND NOT EXISTS (
      SELECT 1
      FROM institution_link_contracts c
      WHERE c.tenant_id = m.tenant_id
        AND c.source_mapping_id = m.id
  );

-- -----------------------------------------------------------------------------
-- 4. 일정 링크 (schedules.mapping_id → 이전된 계약)
-- -----------------------------------------------------------------------------
INSERT INTO institution_link_schedule_links (
    tenant_id, contract_id, schedule_id,
    created_at, updated_at, deleted_at, is_deleted, version
)
SELECT
    s.tenant_id,
    c.id,
    s.id,
    COALESCE(s.created_at, CURRENT_TIMESTAMP(6)),
    COALESCE(s.updated_at, CURRENT_TIMESTAMP(6)),
    NULL,
    FALSE,
    0
FROM schedules s
INNER JOIN institution_link_contracts c
    ON c.tenant_id = s.tenant_id
   AND c.source_mapping_id = s.mapping_id
   AND c.is_deleted = FALSE
WHERE s.tenant_id IS NOT NULL
  AND s.tenant_id <> ''
  AND s.mapping_id IS NOT NULL
  AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND NOT EXISTS (
      SELECT 1
      FROM institution_link_schedule_links l
      WHERE l.tenant_id = s.tenant_id
        AND l.schedule_id = s.id
  );

-- -----------------------------------------------------------------------------
-- 5. 상담일지 복사 (회기 remaining_sessions 불필요). consultation_id = schedules.id
-- -----------------------------------------------------------------------------
INSERT INTO institution_link_consultation_logs (
    tenant_id, contract_id, schedule_id, client_id, consultant_id,
    session_date, session_number,
    client_condition, main_issues, intervention_methods, client_response,
    next_session_plan, homework_assigned, consultant_observations, consultant_assessment,
    progress_evaluation, special_considerations, is_session_completed,
    source_record_id,
    created_at, updated_at, deleted_at, is_deleted, version
)
SELECT
    r.tenant_id,
    l.contract_id,
    l.schedule_id,
    r.client_id,
    r.consultant_id,
    r.session_date,
    r.session_number,
    r.client_condition,
    r.main_issues,
    r.intervention_methods,
    r.client_response,
    r.next_session_plan,
    r.homework_assigned,
    r.consultant_observations,
    r.consultant_assessment,
    r.progress_evaluation,
    r.special_considerations,
    r.is_session_completed,
    r.id,
    COALESCE(r.created_at, CURRENT_TIMESTAMP(6)),
    COALESCE(r.updated_at, CURRENT_TIMESTAMP(6)),
    NULL,
    FALSE,
    0
FROM consultation_records r
INNER JOIN institution_link_schedule_links l
    ON l.tenant_id = r.tenant_id
   AND l.schedule_id = r.consultation_id
   AND l.is_deleted = FALSE
WHERE r.tenant_id IS NOT NULL
  AND r.tenant_id <> ''
  AND r.client_id IS NOT NULL
  AND r.consultant_id IS NOT NULL
  AND r.session_date IS NOT NULL
  AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)
  AND NOT EXISTS (
      SELECT 1
      FROM institution_link_consultation_logs g
      WHERE g.tenant_id = r.tenant_id
        AND g.source_record_id = r.id
  );

-- -----------------------------------------------------------------------------
-- 6. 회기 차감 차단: 이전된 매핑을 가리키던 일정의 mapping_id 해제
-- -----------------------------------------------------------------------------
UPDATE schedules s
SET s.mapping_id = NULL
WHERE s.tenant_id IS NOT NULL
  AND s.tenant_id <> ''
  AND s.mapping_id IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM institution_link_contracts c
      WHERE c.tenant_id = s.tenant_id
        AND c.source_mapping_id = s.mapping_id
        AND c.is_deleted = FALSE
  );

-- -----------------------------------------------------------------------------
-- 7. 회기 일지 소프트삭제 (복사된 행만)
-- -----------------------------------------------------------------------------
UPDATE consultation_records r
SET r.is_deleted = TRUE,
    r.deleted_at = COALESCE(r.deleted_at, CURRENT_TIMESTAMP(6))
WHERE r.tenant_id IS NOT NULL
  AND r.tenant_id <> ''
  AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)
  AND EXISTS (
      SELECT 1
      FROM institution_link_consultation_logs g
      WHERE g.tenant_id = r.tenant_id
        AND g.source_record_id = r.id
  );

-- -----------------------------------------------------------------------------
-- 8. 회기 매핑 소프트삭제 (복사된 타기관 행만). 회기권 행은 그대로.
-- -----------------------------------------------------------------------------
UPDATE consultant_client_mappings m
SET m.is_deleted = TRUE,
    m.deleted_at = COALESCE(m.deleted_at, CURRENT_TIMESTAMP(6))
WHERE m.tenant_id IS NOT NULL
  AND m.tenant_id <> ''
  AND (m.is_deleted = FALSE OR m.is_deleted IS NULL)
  AND EXISTS (
      SELECT 1
      FROM institution_link_contracts c
      WHERE c.tenant_id = m.tenant_id
        AND c.source_mapping_id = m.id
  );
