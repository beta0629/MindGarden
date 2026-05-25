-- =============================================================================
-- SMS_TEMPLATE — 트랜잭션 SMS 본문 시드 (어드민 어드민 편집 가능 어드민 정책 기반)
--
-- 배경:
--   • 기존 NotificationServiceImpl.buildSmsMessage 는 SMS_TEMPLATE 공통코드를 조회하지만
--     실 운영 시드가 부재해 의미 없는 fallback 발송이 차단되어 있었다(2026-05-23 핫픽스).
--   • BatchNotificationDispatchServiceImpl 의 buildSmsBody* 는 한국어 본문이 코드에 박혀
--     운영 결정권자 컨펌(2026-05-29) 으로 DB 화 + 어드민 UI 편집 가능 정책으로 전환.
--
-- 정책:
--   • tenant_id = NULL (전역/코어 row) — 신규 row 는 글로벌 시드.
--   • 테넌트별 override 는 어드민 UI(/admin/sms-templates) 에서 동일 code_value 의 tenant row
--     로 별도 INSERT/UPDATE — 본 시드는 글로벌만 다룬다.
--   • code_label = SMS 본문(80바이트 이내 권장 — 한국어 약 40~45자, 안전마진 포함).
--   • 변수 치환 패턴: 알림톡과 동일한 named pattern `{{varName}}` (SmsTemplateRenderer 가 처리).
--   • is_active = TRUE — buildSmsMessage 가 활성 row 만 사용.
--   • sort_order: 200 부터 — 기존 그룹(공통코드 시드 0~107)과 충돌 회피.
--
-- 멱등성:
--   • INSERT ... SELECT ... WHERE NOT EXISTS — 재실행 시 변경 없음 (V20260331_002 패턴 동일).
--   • code_label 운영 수정은 어드민 UI 의 tenant override 로 수행 — 글로벌 본문 수정은
--     별도 Flyway PR 로만 변경한다(SSOT 가드).
--
-- 가드:
--   • V20260528_003 슬롯은 알림톡 검수 통과 후 채워질 예정이므로 본 마이그레이션은 _004 슬롯 사용.
--   • 호출 경로(NotificationServiceImpl, BatchNotificationDispatchServiceImpl) 는 본 시드 후
--     SmsTemplateService 를 통해 동일 키로 조회한다.
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- A) NotificationServiceImpl 트랜잭션 7종 (예약·결제·환불·일정 변경)
--    호출자: NotificationServiceImpl.buildSmsMessage (NotificationType.name() 매칭)
-- ──────────────────────────────────────────────────────────────────────────────

-- A1) CONSULTATION_CONFIRMED
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'CONSULTATION_CONFIRMED',
    '[마인드가든] {{consultationDate}} {{consultationTime}} {{consultantName}} 상담사 상담이 확정되었습니다.',
    '상담 확정 안내 SMS',
    'NotificationType.CONSULTATION_CONFIRMED 발송 본문 — 알림톡 실패 시 SMS 폴백.',
    200, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","consultationDate","consultationTime"],"trigger":"NotificationServiceImpl.sendConsultationConfirmed","priority":"HIGH"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'CONSULTATION_CONFIRMED'
);

-- A2) CONSULTATION_REMINDER
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'CONSULTATION_REMINDER',
    '[마인드가든] {{consultationTime}} {{consultantName}} 상담사 상담이 예정되어 있습니다. 시간 맞춰 준비해 주세요.',
    '상담 리마인더 SMS',
    'NotificationType.CONSULTATION_REMINDER 발송 본문 — 1시간 전 알림.',
    201, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","consultationTime"],"trigger":"NotificationServiceImpl.sendConsultationReminder","priority":"HIGH"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'CONSULTATION_REMINDER'
);

-- A3) CONSULTATION_CANCELLED
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'CONSULTATION_CANCELLED',
    '[마인드가든] {{cancelledDateTime}} {{consultantName}} 상담사 상담 예약이 취소되었습니다.',
    '상담 취소 안내 SMS',
    'NotificationType.CONSULTATION_CANCELLED 발송 본문.',
    202, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","cancelledDateTime"],"trigger":"NotificationServiceImpl.sendConsultationCancelled","priority":"HIGH"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'CONSULTATION_CANCELLED'
);

-- A4) REFUND_COMPLETED
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'REFUND_COMPLETED',
    '[마인드가든] 환불이 완료되었습니다. 환불 회기 {{refundSessions}}회 / 금액 {{refundAmount}}원.',
    '환불 완료 안내 SMS',
    'NotificationType.REFUND_COMPLETED 발송 본문.',
    203, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"PAYMENT","variables":["refundSessions","refundAmount"],"trigger":"NotificationServiceImpl.sendRefundCompleted","priority":"MEDIUM"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'REFUND_COMPLETED'
);

-- A5) SCHEDULE_CHANGED
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'SCHEDULE_CHANGED',
    '[마인드가든] {{consultantName}} 상담사 상담 일정이 변경되었습니다. {{oldDateTime}} → {{newDateTime}}',
    '일정 변경 안내 SMS',
    'NotificationType.SCHEDULE_CHANGED 발송 본문.',
    204, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","oldDateTime","newDateTime"],"trigger":"NotificationServiceImpl.sendScheduleChanged","priority":"HIGH"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'SCHEDULE_CHANGED'
);

-- A6) PAYMENT_COMPLETED
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'PAYMENT_COMPLETED',
    '[마인드가든] 결제가 완료되었습니다. {{paymentAmount}}원 / {{packageName}} / {{consultantName}} 상담사.',
    '결제 완료 안내 SMS',
    'NotificationType.PAYMENT_COMPLETED 발송 본문.',
    205, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"PAYMENT","variables":["paymentAmount","packageName","consultantName"],"trigger":"NotificationServiceImpl.sendPaymentCompleted","priority":"MEDIUM"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'PAYMENT_COMPLETED'
);

-- A7) DEPOSIT_PENDING_REMINDER
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'DEPOSIT_PENDING_REMINDER',
    '[마인드가든] 입금 확인이 필요합니다. 매핑 #{{mappingId}} {{clientName}} / {{packagePrice}}원 / {{hoursElapsed}}시간 경과.',
    '입금 확인 대기 알림 SMS',
    'NotificationType.DEPOSIT_PENDING_REMINDER 발송 본문 (관리자 대상).',
    206, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"PAYMENT","variables":["mappingId","clientName","consultantName","packagePrice","hoursElapsed"],"trigger":"NotificationServiceImpl.sendDepositPendingReminder","priority":"HIGH"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'DEPOSIT_PENDING_REMINDER'
);

-- ──────────────────────────────────────────────────────────────────────────────
-- B) BatchNotificationDispatchService 트랜잭션 8종 (배치 SMS 폴백 본문)
--    호출자: BatchNotificationDispatchServiceImpl.buildSmsBody* (template code 매칭)
-- ──────────────────────────────────────────────────────────────────────────────

-- B1) RESERVATION_REMINDER_D2
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'RESERVATION_REMINDER_D2',
    '{{scheduleDate}} {{scheduleTime}} 상담 예약 안내입니다. ({{consultantName}} 상담사) 변경/취소 시 미리 연락 부탁드립니다.',
    'D-2 예약 안내 SMS',
    'BatchNotification RESERVATION_REMINDER_D2 SMS 폴백 본문.',
    210, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","scheduleDate","scheduleTime"],"trigger":"ReservationReminderScheduler D-2","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'RESERVATION_REMINDER_D2'
);

-- B2) RESERVATION_IMMEDIATE_SINGLE
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'RESERVATION_IMMEDIATE_SINGLE',
    '상담 예약 확정: {{scheduleDate}} {{scheduleTime}} ({{consultantName}} 상담사). 편안하게 오시기 바랍니다.',
    '단회기 즉시 예약 확정 SMS',
    'BatchNotification RESERVATION_IMMEDIATE_SINGLE SMS 폴백 본문.',
    211, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","scheduleDate","scheduleTime"],"trigger":"single session schedule create","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'RESERVATION_IMMEDIATE_SINGLE'
);

-- B3) RESERVATION_IMMEDIATE_LATE
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'RESERVATION_IMMEDIATE_LATE',
    '상담 예약 확정: {{scheduleDate}} {{scheduleTime}} ({{consultantName}} 상담사). 예약일이 임박하니 일정 확인 부탁드립니다.',
    'D-2 미달 즉시 예약 확정 SMS',
    'BatchNotification RESERVATION_IMMEDIATE_LATE SMS 폴백 본문.',
    212, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"BOOKING","variables":["consultantName","scheduleDate","scheduleTime"],"trigger":"within D-2 schedule create","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'RESERVATION_IMMEDIATE_LATE'
);

-- B4) SESSION_ENDING_SOON
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'SESSION_ENDING_SOON',
    '패키지 마지막 1회기가 남았습니다. ({{consultantName}} 상담사) 좋은 마무리 되시길 바랍니다.',
    '회기 종료 예고 SMS',
    'BatchNotification SESSION_ENDING_SOON SMS 폴백 본문.',
    213, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"SESSION","variables":["consultantName"],"trigger":"session decrement (remaining=1)","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'SESSION_ENDING_SOON'
);

-- B5) SESSION_RENEW_PROMPT (마케팅 — F2 정책에 따라 SMS 폴백 미수행이지만 본문은 보존)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'SESSION_RENEW_PROMPT',
    '그동안 상담 함께해 주셔서 감사합니다. 추가 상담이 필요하시면 언제든 연락 주세요. (수신거부:080-XXX-XXXX)',
    '회기 갱신 유도 SMS(마케팅)',
    'BatchNotification SESSION_RENEW_PROMPT SMS 본문 (마케팅 동의 시 한정).',
    214, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"MARKETING","variables":[],"trigger":"final session completed (marketing consent required)","priority":"marketing"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'SESSION_RENEW_PROMPT'
);

-- B6) CLIENT_WELCOME_FIRST
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'CLIENT_WELCOME_FIRST',
    '{{clientName}}님, 마인드가든에 오신 것을 환영합니다. {{consultantName}} 상담사와 함께 시작합니다. 문의: {{contactPhone}}',
    '신규 매칭 환영 SMS',
    'BatchNotification CLIENT_WELCOME_FIRST SMS 폴백 본문 (영구 1회).',
    215, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"ONBOARDING","variables":["clientName","consultantName","contactPhone"],"trigger":"first mapping create","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'CLIENT_WELCOME_FIRST'
);

-- B7) INITIAL_GUIDE_OFFLINE
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'INITIAL_GUIDE_OFFLINE',
    '첫 상담: {{scheduleDate}} {{scheduleTime}} ({{consultantName}} 상담사). 15분 전 도착 권장, 변경 시 24h 전 연락 부탁드립니다.',
    '첫 상담 안내(오프라인) SMS',
    'BatchNotification INITIAL_GUIDE_OFFLINE SMS 폴백 본문.',
    216, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"ONBOARDING","variables":["consultantName","scheduleDate","scheduleTime","branchAddress"],"trigger":"first schedule create (offline)","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'INITIAL_GUIDE_OFFLINE'
);

-- B8) INITIAL_GUIDE_ONLINE
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    NULL, 'SMS_TEMPLATE', 'INITIAL_GUIDE_ONLINE',
    '첫 상담: {{scheduleDate}} {{scheduleTime}} ({{consultantName}} 상담사). 10분 전 접속 권장, 화상 링크는 알림톡을 참고해 주세요.',
    '첫 상담 안내(온라인) SMS',
    'BatchNotification INITIAL_GUIDE_ONLINE SMS 폴백 본문.',
    217, TRUE, FALSE, 0, NOW(), NOW(),
    '{"category":"ONBOARDING","variables":["consultantName","scheduleDate","scheduleTime","onlineLink"],"trigger":"first schedule create (online)","priority":"informational"}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'SMS_TEMPLATE'
      AND c.code_value = 'INITIAL_GUIDE_ONLINE'
);
