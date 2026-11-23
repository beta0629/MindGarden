-- SCT 관리번호(테넌트 시퀀) + 보관일수 기본 365
-- @author MindGarden
-- @since 2026-11-23

CREATE TABLE IF NOT EXISTS sct_management_no_seq (
    tenant_id VARCHAR(36) NOT NULL,
    next_val BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 관리번호 테넌트 시퀀스';

ALTER TABLE sct_invitations
    ADD COLUMN management_no VARCHAR(32) NULL COMMENT '테넌트 단위 관리번호(PII 없음)' AFTER consultant_id;

-- 기존 행 백필: 테넌트별 생성 순서로 SCT-000001…
UPDATE sct_invitations i
INNER JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY id) AS rn
    FROM sct_invitations
    WHERE management_no IS NULL
) x ON x.id = i.id
SET i.management_no = CONCAT('SCT-', LPAD(x.rn, 6, '0'));

-- 시퀀 커서 동기화
INSERT INTO sct_management_no_seq (tenant_id, next_val)
SELECT tenant_id, COALESCE(MAX(CAST(SUBSTRING(management_no, 5) AS UNSIGNED)), 0) + 1
FROM sct_invitations
WHERE management_no IS NOT NULL
  AND management_no REGEXP '^SCT-[0-9]+$'
GROUP BY tenant_id
ON DUPLICATE KEY UPDATE
    next_val = GREATEST(sct_management_no_seq.next_val, VALUES(next_val));

ALTER TABLE sct_invitations
    MODIFY COLUMN management_no VARCHAR(32) NOT NULL COMMENT '테넌트 단위 관리번호(PII 없음)';

ALTER TABLE sct_invitations
    ADD UNIQUE KEY uk_sct_inv_tenant_mgmt_no (tenant_id, management_no);

-- 보관 기본 365일 (null 기본 제거). 배치 자동 삭제는 없음.
UPDATE system_config
SET config_value = '365',
    description = 'SCT 응답 보관일수. 기본 365(실시일/제출일 기준). 자동 삭제 배치 없음',
    updated_at = NOW(),
    updated_by = 'SYSTEM'
WHERE config_key = 'sct.retention.days';

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.retention.days', '365',
       'SCT 응답 보관일수. 기본 365(실시일/제출일 기준). 자동 삭제 배치 없음',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.retention.days' AND is_active = 1
);
