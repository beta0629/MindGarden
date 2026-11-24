-- SCT 기능 플래그·공통코드·동의 템플릿·만료/보관 설정 시드
-- feature.sct.enabled 전역 기본 false, 마인드가든 테넌트만 ON (UUID 하드코딩 금지)
-- @author MindGarden
-- @since 2026-11-23

-- 전역(tenant_id='') feature flag 기본 OFF
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'feature.sct.enabled', 'false',
     'SCT 온라인 질문지 기능. 기본 false(fail-closed). 테넌트 행이 있으면 테넌트 우선',
     'FEATURE', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
    ('', 'sct.link.expiry.days', '14',
     'SCT 링크 만료일수. 기본 14, 허용 1~30. 새 발송부터 적용',
     'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
    ('', 'sct.retention.days', NULL,
     'SCT 응답 보관일수. null/미설정=자동 파기 없음(배치 없음, 설정만)',
     'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    updated_at = NOW();

-- 마인드가든 테넌트만 feature ON (name/subdomain 조회, UUID 리터럴 금지)
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    t.tenant_id,
    'feature.sct.enabled',
    'true',
    'SCT 온라인 질문지 — 마인드가든 테넌트 ON',
    'FEATURE',
    false,
    true,
    'SYSTEM',
    'SYSTEM',
    NOW(),
    NOW()
FROM tenants t
WHERE t.is_deleted = 0
  AND (
        t.name LIKE '%마인드가든%'
     OR LOWER(IFNULL(t.subdomain, '')) LIKE '%mindgarden%'
     OR LOWER(IFNULL(t.name, '')) LIKE '%mindgarden%'
  )
ON DUPLICATE KEY UPDATE
    config_value = 'true',
    description = VALUES(description),
    updated_at = NOW();

-- 마인드가든 테넌트 만료/보관 기본값(전역과 동일, 테넌트 오버라이드 가능)
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    t.tenant_id,
    cfg.config_key,
    cfg.config_value,
    cfg.description,
    'SCT',
    false,
    true,
    'SYSTEM',
    'SYSTEM',
    NOW(),
    NOW()
FROM tenants t
CROSS JOIN (
    SELECT 'sct.link.expiry.days' AS config_key, '14' AS config_value,
           'SCT 링크 만료일수(테넌트). 기본 14, 허용 1~30' AS description
    UNION ALL
    SELECT 'sct.retention.days', NULL,
           'SCT 응답 보관일수(테넌트). null=자동 파기 없음'
) cfg
WHERE t.is_deleted = 0
  AND (
        t.name LIKE '%마인드가든%'
     OR LOWER(IFNULL(t.subdomain, '')) LIKE '%mindgarden%'
     OR LOWER(IFNULL(t.name, '')) LIKE '%mindgarden%'
  )
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW();

-- 공통코드: SCT_FORM_TYPE (글로벌 tenant_id NULL)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT NULL, v.code_group, v.code_value, v.code_label, v.code_label, v.code_description,
       v.sort_order, TRUE, FALSE, 0, NOW(), NOW()
FROM (
    SELECT 'SCT_FORM_TYPE' AS code_group, 'ADULT' AS code_value, '성인용' AS code_label,
           '마인드가든 SCT 성인' AS code_description, 1 AS sort_order
    UNION ALL SELECT 'SCT_FORM_TYPE', 'ADOLESCENT', '청소년용', '마인드가든 SCT 청소년', 2
    UNION ALL SELECT 'SCT_FORM_TYPE', 'CHILD', '아동용', '마인드가든 SCT 아동', 3
) v
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.code_group = v.code_group
      AND c.code_value = v.code_value
      AND c.tenant_id IS NULL
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
);

-- 공통코드: SCT_INVITE_STATUS
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT NULL, v.code_group, v.code_value, v.code_label, v.code_label, v.code_description,
       v.sort_order, TRUE, FALSE, 0, NOW(), NOW()
FROM (
    SELECT 'SCT_INVITE_STATUS' AS code_group, 'SENT' AS code_value, '보냄' AS code_label,
           '발송·링크 유효' AS code_description, 1 AS sort_order
    UNION ALL SELECT 'SCT_INVITE_STATUS', 'DRAFT', '진행 중', '임시 응답 존재', 2
    UNION ALL SELECT 'SCT_INVITE_STATUS', 'SUBMITTED', '제출', '제출 완료', 3
    UNION ALL SELECT 'SCT_INVITE_STATUS', 'EXPIRED', '만료', '기한 지남', 4
    UNION ALL SELECT 'SCT_INVITE_STATUS', 'CANCELLED', '취소', '관리자 취소', 5
) v
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.code_group = v.code_group
      AND c.code_value = v.code_value
      AND c.tenant_id IS NULL
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
);

-- 공통코드: SCT_SMS_TEMPLATE (시안 자리값)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT NULL, 'SCT_SMS_TEMPLATE', 'INVITE_LINK', 'SCT 발송', 'SCT 발송',
       '문장완성 질문지 링크 문자. {link} {formTitle} {expiresAt} 치환',
       1, TRUE, FALSE, 0, NOW(), NOW(),
       '{"template":"[마인드가든] {formTitle} 작성 요청입니다. 기한: {expiresAt}. 링크: {link}"}'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.code_group = 'SCT_SMS_TEMPLATE'
      AND c.code_value = 'INVITE_LINK'
      AND c.tenant_id IS NULL
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
);

-- 동의 문구 템플릿 (시안 자리값, 버전 관리)
INSERT INTO sct_consent_templates (
    tenant_id, consent_type, version, title, body_text, is_active
)
SELECT '', v.consent_type, v.version, v.title, v.body_text, 1
FROM (
    SELECT
        'SENSITIVE_INFO' AS consent_type,
        'v1-placeholder' AS version,
        '민감정보 수집·이용 동의' AS title,
        '본 질문지는 상담 면담 참고를 위한 민감정보를 포함합니다. 수집 항목: 문장완성 응답. 목적: 상담 참고. 보관: 센터 개인정보 처리방침. 거부권: 동의하지 않아도 상담은 받을 수 있습니다. (시안 자리값 — 법률 검토본으로 교체)' AS body_text
    UNION ALL
    SELECT
        'GUARDIAN_UNDER_14',
        'v1-placeholder',
        '법정대리인(보호자) 동의',
        '만 14세 미만 아동의 문장완성 질문지 작성에 대해 법정대리인으로서 동의합니다. (시안 자리값 — 법률 검토본으로 교체)' AS body_text
) v
WHERE NOT EXISTS (
    SELECT 1 FROM sct_consent_templates t
    WHERE t.tenant_id = ''
      AND t.consent_type = v.consent_type
      AND t.version = v.version
);
