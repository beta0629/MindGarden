-- SCT 동의 SSOT(web-handoff) · 머리칸 · 동의 승계 컬럼
-- @author MindGarden
-- @since 2026-11-23

SET @db := DATABASE();

-- sct_consents.client_id
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'client_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN client_id BIGINT NULL AFTER invitation_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'signer_name_enc'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN signer_name_enc VARCHAR(512) NULL AFTER guardian_relation',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'child_name_confirm_enc'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN child_name_confirm_enc VARCHAR(512) NULL AFTER signer_name_enc',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'is_revoked'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN is_revoked TINYINT(1) NOT NULL DEFAULT 0 AFTER child_name_confirm_enc',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'revoked_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN revoked_at DATETIME(6) NULL AFTER is_revoked',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND COLUMN_NAME = 'revoked_by_user_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD COLUMN revoked_by_user_id BIGINT NULL AFTER revoked_at',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 인덱스
SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consents' AND INDEX_NAME = 'idx_sct_consent_client'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consents ADD KEY idx_sct_consent_client (tenant_id, client_id, consent_type, is_revoked)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- consent templates form_type
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consent_templates' AND COLUMN_NAME = 'form_type'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consent_templates ADD COLUMN form_type VARCHAR(20) NULL AFTER consent_type',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 동일 version+consent_type 에 폼별 문구 허용(성인/청소년/아동)
SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consent_templates' AND INDEX_NAME = 'uk_sct_consent_tpl'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE sct_consent_templates DROP INDEX uk_sct_consent_tpl',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_consent_templates' AND INDEX_NAME = 'uk_sct_consent_tpl'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_consent_templates ADD UNIQUE KEY uk_sct_consent_tpl (tenant_id, consent_type, form_type, version)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- form header fields
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'sct_form_templates' AND COLUMN_NAME = 'header_fields_json'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE sct_form_templates ADD COLUMN header_fields_json TEXT NULL AFTER target_desc',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 구 자리값 템플릿 비활성
UPDATE sct_consent_templates
SET is_active = 0
WHERE tenant_id = '' AND version = 'v1-placeholder';

-- 법정대리인 본인확인 방식 설정(체크+성명·관계만). 외부 인증 금지.
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'sct.guardian.verify.mode', 'CHECK_NAME_RELATION',
     'SCT 법정대리인 본인확인 방식. CHECK_NAME_RELATION만 지원(외부 인증 금지)',
     'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW();


INSERT INTO sct_consent_templates (tenant_id, consent_type, form_type, version, title, body_text, is_active)
SELECT '', 'SENSITIVE_INFO', 'ADULT', 'handoff-2026-11-23', '실시 안내 및 동의(성인)', '**실시 안내 및 동의**

이 쪽은 응답지와 분리하여 상담 기록에 보관할 수 있습니다.

**1. 실시 목적과 쓰임**

이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. 응답은 담당 상담사가 면담과 함께 살펴봅니다. 응답을 거부하거나 도중에 중단할 수 있으며, 답하기를 원하지 않는 문항은 비워 두셔도 됩니다.

**2. 수집 항목과 민감정보 동의**

이 질문지를 실시하면 질문지 응답, 실시 날짜, 나이를 수집합니다. 응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. 민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.

**민감정보(심리·건강 관련 정보) 처리에 대한 동의**

- □ 동의함
- □ 동의하지 않음

**3. 비밀보장**

이 질문지의 비밀보장과 그 예외는 상담 동의서에 안내한 기준을 따릅니다.

**4. 보관과 파기**

작성한 응답은 상담 기록과 같은 수준으로 잠가 보관합니다. 응답은 실시일로부터 1년간 보관한 뒤 파기합니다.

**5. 동의의 적용과 철회**

한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회할 수 있습니다.

**6. 서명**

- 내담자    서명 __________    날짜 20____년 ____월 ____일', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sct_consent_templates t
  WHERE t.tenant_id = '' AND t.consent_type = 'SENSITIVE_INFO'
    AND t.form_type = 'ADULT' AND t.version = 'handoff-2026-11-23'
);

INSERT INTO sct_consent_templates (tenant_id, consent_type, form_type, version, title, body_text, is_active)
SELECT '', 'SENSITIVE_INFO', 'ADOLESCENT', 'handoff-2026-11-23', '실시 안내 및 동의(청소년)', '**실시 안내 및 동의**

이 쪽은 응답지와 분리하여 상담 기록에 보관할 수 있습니다.

**1. 실시 목적과 쓰임**

이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. 응답은 담당 상담사가 면담과 함께 살펴봅니다. 응답을 거부하거나 도중에 중단할 수 있으며, 답하기를 원하지 않는 문항은 비워 두셔도 됩니다.

**2. 수집 항목과 민감정보 동의**

이 질문지를 실시하면 질문지 응답, 실시 날짜, 나이, 학교·학년을 수집합니다. 응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. 민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.

**민감정보(심리·건강 관련 정보) 처리에 대한 동의**

- □ 동의함
- □ 동의하지 않음

만 14세 미만인 경우에는 법정대리인(보호자)의 동의가 필요합니다. 만 14세 이상 청소년의 보호자 동의 범위는 센터 규정을 따릅니다.

**3. 비밀보장**

이 질문지의 비밀보장과 그 예외는 상담 동의서에 안내한 기준을 따릅니다.

**4. 보관과 파기**

작성한 응답은 상담 기록과 같은 수준으로 잠가 보관합니다. 응답은 실시일로부터 1년간 보관한 뒤 파기합니다.

**5. 동의의 적용과 철회**

한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회할 수 있습니다.

**6. 서명**

- 본인    서명 __________    날짜 20____년 ____월 ____일
- 법정대리인(보호자)    서명 __________    관계 __________    날짜 20____년 ____월 ____일', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sct_consent_templates t
  WHERE t.tenant_id = '' AND t.consent_type = 'SENSITIVE_INFO'
    AND t.form_type = 'ADOLESCENT' AND t.version = 'handoff-2026-11-23'
);

INSERT INTO sct_consent_templates (tenant_id, consent_type, form_type, version, title, body_text, is_active)
SELECT '', 'SENSITIVE_INFO', 'CHILD', 'handoff-2026-11-23', '실시 안내 및 동의(아동·보호자)', '**실시 안내 및 동의**

이 쪽은 보호자께서 읽어 주시기 바랍니다. 응답지와 분리하여 상담 기록에 보관할 수 있습니다.

**1. 실시 목적과 쓰임**

이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. 아이의 응답은 담당 상담사가 면담과 함께 살펴봅니다. 아이 또는 보호자는 응답을 거부하거나 도중에 중단할 수 있으며, 답하기를 원하지 않는 문항은 비워 두어도 됩니다.

**2. 수집 항목과 민감정보 동의**

이 질문지를 실시하면 아이의 질문지 응답, 실시 날짜, 나이, 학교·학년을 수집합니다. 응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. 민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.

**민감정보(심리·건강 관련 정보) 처리에 대한 동의**

- □ 동의함
- □ 동의하지 않음

아동은 만 14세 미만이므로 법정대리인(보호자)의 동의가 필요합니다. 이는 개인정보 보호법 제22조의2에 따른 것입니다.

**3. 비밀보장**

이 질문지의 비밀보장과 그 예외는 상담 동의서에 안내한 기준을 따릅니다.

**4. 보관과 파기**

작성한 응답지는 상담 기록과 같은 수준으로 잠가 보관합니다. 응답지는 실시일로부터 1년간 보관한 뒤 파쇄합니다.

**5. 동의의 적용과 철회**

한 번 동의하시면 철회하실 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회하실 수 있습니다.

**6. 서명**

- 법정대리인(보호자)    서명 __________    관계 __________    날짜 20____년 ____월 ____일
- (선택) 아동 본인 확인    이름 __________', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sct_consent_templates t
  WHERE t.tenant_id = '' AND t.consent_type = 'SENSITIVE_INFO'
    AND t.form_type = 'CHILD' AND t.version = 'handoff-2026-11-23'
);

INSERT INTO sct_consent_templates (tenant_id, consent_type, form_type, version, title, body_text, is_active)
SELECT '', 'GUARDIAN_UNDER_14', NULL, 'handoff-2026-11-23', '법정대리인(보호자) 동의', '아동·만 14세 미만 청소년의 문장완성 질문지 실시에 대해 법정대리인(보호자)으로서 동의합니다. 민감정보(심리·건강 관련 정보) 처리 동의는 위 실시 안내 문구와 함께 적용됩니다. 한 번 동의하시면 철회하실 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회하실 수 있습니다.', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sct_consent_templates t
  WHERE t.tenant_id = '' AND t.consent_type = 'GUARDIAN_UNDER_14'
    AND t.version = 'handoff-2026-11-23' AND (t.form_type IS NULL OR t.form_type = '')
);

UPDATE sct_form_templates
SET header_fields_json = '[[["센터명", "마인드가든심리상담센터"], ["실시 날짜", "20____년 ____월 ____일"]], [["나이", "______ 세"]]]'
WHERE tenant_id = '' AND form_type = 'ADULT' AND version = 'v3';

UPDATE sct_form_templates
SET header_fields_json = '[[["센터명", "마인드가든심리상담센터"], ["실시 날짜", "20____년 ____월 ____일"]], [["학교", "□ 중학교    □ 고등학교    □ 기타(학교 밖 등)"]], [["학교명", "____________________"]], [["학년·나이", "____ 학년 · ____ 세"]]]'
WHERE tenant_id = '' AND form_type = 'ADOLESCENT' AND version = 'v3';

UPDATE sct_form_templates
SET header_fields_json = '[[["센터명", "마인드가든심리상담센터"], ["실시 날짜", "20____년 ____월 ____일"]], [["학교", "____________ 초등학교"]], [["학년·나이", "____ 학년 · ____ 세"]]]'
WHERE tenant_id = '' AND form_type = 'CHILD' AND version = 'v3';

-- 문항 문구에서 인라인 '[□ 해당 없음]' 표기 제거(플래그 allows_not_applicable 유지, build_sct_v3 문구 정합)
UPDATE sct_form_items i
JOIN sct_form_templates t ON t.id = i.form_template_id
SET i.prompt_text = TRIM(REPLACE(i.prompt_text, '  [□ 해당 없음]', ''))
WHERE t.tenant_id = '' AND t.version = 'v3'
  AND i.prompt_text LIKE '%[□ 해당 없음]%';
