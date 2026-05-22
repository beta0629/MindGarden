-- =============================================================================
-- ALIMTALK_BIZ_TEMPLATE_CODE — 알림 배치 / 회기 종료 / 환영·첫상담 8종 시드 스켈레톤
-- 기획: docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md (§2 / §11 / §12)
-- 매핑 컴포넌트: AlimtalkTemplateMappingResolver (codeLabel = solapi templateId)
-- 호출자: BatchNotificationDispatchServiceImpl, AdminTestNotificationServiceImpl,
--         AdminManualNotificationServiceImpl, NotificationServiceImpl
--
-- 정책:
--   • code_label 은 솔라피 콘솔 검수 통과 전이므로 **빈 문자열('')** 로 고정한다.
--     (resolver 가 isBlank() 처리 → 매핑 미발급으로 간주 → SMS 폴백/F2 정책 진입)
--   • 검수 통과 후 별도 Flyway PR 에서 code_label 을 KA01TP... 로 UPDATE 한다.
--     (운영 절차: docs/project-management/2026-05-23/ALIMTALK_TEMPLATE_ID_ROTATION.md)
--   • tenant_id = NULL (전역/코어 row) — resolver 가 테넌트 row 우선 + 코어 폴백.
--   • sort_order 100~107 (기존 row 와 충돌 없도록 — 본 그룹은 신규).
--
-- 멱등성:
--   • INSERT ... SELECT ... WHERE NOT EXISTS (V20260331_002 패턴 동일)
--   • 재실행 시 변경 없음.
-- =============================================================================

-- 1) RESERVATION_REMINDER_D2 — D-2 09:00 KST 배치 (정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'RESERVATION_REMINDER_D2', '', 'D-2 예약 안내',
    '예약 2일 전 안내 (D-2 09:00 KST 배치). 솔라피 검수 통과 후 code_label 갱신.',
    100, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","remainingSessions"],"trigger":"D-2 09:00 KST scheduler","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'RESERVATION_REMINDER_D2'
);

-- 2) RESERVATION_IMMEDIATE_SINGLE — 단회기(단발성 결제) 예약 즉시 (정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'RESERVATION_IMMEDIATE_SINGLE', '', '단회기 즉시 예약 안내',
    '단발성 결제(1회기) 예약 등록 즉시 발송. 솔라피 검수 통과 후 code_label 갱신.',
    101, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (single session)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'RESERVATION_IMMEDIATE_SINGLE'
);

-- 3) RESERVATION_IMMEDIATE_LATE — D-2 미달 즉시 (정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'RESERVATION_IMMEDIATE_LATE', '', 'D-2 미달 즉시 예약 안내',
    '예약 등록 시점이 D-2 미만인 경우 즉시 발송. 솔라피 검수 통과 후 code_label 갱신.',
    102, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime"],"trigger":"ScheduleServiceImpl.notifyScheduleCreated (within D-2)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'RESERVATION_IMMEDIATE_LATE'
);

-- 4) SESSION_ENDING_SOON — 잔여 1회기 진입 안내 (정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'SESSION_ENDING_SOON', '', '회기 종료 예고',
    '잔여 1회기 진입 시 발송 (회기 차감 이벤트). 솔라피 검수 통과 후 code_label 갱신.',
    103, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","remainingSessions"],"trigger":"session decrement event (remaining=1)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'SESSION_ENDING_SOON'
);

-- 5) SESSION_RENEW_PROMPT — 회기 갱신 유도 (광고/마케팅, 수신동의 필수)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'SESSION_RENEW_PROMPT', '', '회기 갱신 유도(마케팅)',
    '마지막 회기 종료 직후 갱신 유도 (마케팅 동의 필수, F2 SMS 폴백 미수행). 솔라피 검수 통과 후 code_label 갱신.',
    104, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"marketing","variables":["clientName","consultantName","lastSessionDate"],"trigger":"session end event (final session completed)","fallback":"none (F2 skip_marketing)","approval_status":"pending","marketing_consent_required":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'SESSION_RENEW_PROMPT'
);

-- 6) CLIENT_WELCOME_FIRST — 신규 매칭 환영 (정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'CLIENT_WELCOME_FIRST', '', '신규 매칭 환영',
    '신규 매칭 생성 시 user 영구 1회 발송. 솔라피 검수 통과 후 code_label 갱신.',
    105, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","contactPhone"],"trigger":"consultant_client_mapping create (first per user)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'CLIENT_WELCOME_FIRST'
);

-- 7) INITIAL_GUIDE_OFFLINE — 첫 상담 안내(오프라인, 정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'INITIAL_GUIDE_OFFLINE', '', '첫 상담 안내(오프라인)',
    '첫 상담 예약 시 user 영구 1회 발송 (ONLINE 과 멱등 공유). 솔라피 검수 통과 후 code_label 갱신.',
    106, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","branchAddress"],"trigger":"first schedule create (consultation_method != ONLINE)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'INITIAL_GUIDE_OFFLINE'
);

-- 8) INITIAL_GUIDE_ONLINE — 첫 상담 안내(온라인, 정보성)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'ALIMTALK_BIZ_TEMPLATE_CODE', 'INITIAL_GUIDE_ONLINE', '', '첫 상담 안내(온라인)',
    '첫 상담 예약 시 user 영구 1회 발송 (OFFLINE 과 멱등 공유). 솔라피 검수 통과 후 code_label 갱신.',
    107, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"informational","variables":["clientName","consultantName","scheduleDate","scheduleTime","onlineLink"],"trigger":"first schedule create (consultation_method = ONLINE)","fallback":"sms","approval_status":"pending"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ALIMTALK_BIZ_TEMPLATE_CODE'
      AND c.code_value = 'INITIAL_GUIDE_ONLINE'
);
