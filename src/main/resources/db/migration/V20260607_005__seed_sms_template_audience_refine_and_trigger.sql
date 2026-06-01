-- =============================================================================
-- SMS 템플릿 audience 재분류 (BOTH 4종) + trigger 메타 신설
--   (2026-06-01, 사용자 컨펌 — Phase A 어드민 UI 정확성 개선)
--
-- 배경:
--   사용자 보고: "상담사도 같이 나가야 하는 템플릿이 있을 것" (예: 리마인더·상담확정).
--   "발송요건 설명이 붙으면 안 헷갈릴 것 같다" — 어드민이 본문만 보고 트리거 추정 못함.
--
-- 정책 변경:
--   • V20260607_004 에서 15종 일괄 'CLIENT' 시드를 정확화.
--   • audience 값 확장: CLIENT / CONSULTANT / BOTH (내담자+상담사) / ADMIN / SYSTEM.
--   • 사용자 컨펌 분류 (Phase A — UI 메타만, 실제 상담사 발송 로직은 Phase B 별도):
--       BOTH (4종):
--         - CONSULTATION_CONFIRMED   (#3)  상담 일정이 확정될 때 → 양쪽 알림
--         - CONSULTATION_REMINDER    (#4)  상담 1시간 전 → 양쪽 알림
--         - SCHEDULE_CHANGED         (#13) 상담 일정 변경 → 양쪽 알림
--         - SESSION_ENDING_SOON      (#14) 잔여 회기 임계 → 양쪽 알림
--       ADMIN (1종):
--         - DEPOSIT_PENDING_REMINDER (#5)  관리자 입금 미확인 알림
--       CLIENT (10종): 나머지
--   • extra_data.trigger 키 신설 — 어드민 UI 에 '발송 조건: ...' 강조 노출.
--     발송 정책 SSOT 가 NotificationServiceImpl/BatchNotificationDispatchServiceImpl
--     코드에 분산되어 있어 어드민이 확인 못하던 문제 해소.
--
-- Phase B (별도 PR · 사용자 합의 후):
--   BOTH 4종의 실제 상담사 SMS 발송 로직 구현 (본문 변수 분기 + 시드 + 테스트).
--
-- 멱등성:
--   • JSON_MERGE_PATCH — 같은 키 재실행 시 NO-OP.
--   • tenant_id IS NULL (글로벌) 만 접촉.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) BOTH 분류 4종 (audience='BOTH')
-- ----------------------------------------------------------------------------
UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('audience', 'BOTH')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND code_value IN (
      'CONSULTATION_CONFIRMED',
      'CONSULTATION_REMINDER',
      'SCHEDULE_CHANGED',
      'SESSION_ENDING_SOON'
  );

-- ----------------------------------------------------------------------------
-- 2) ADMIN 분류 1종 (audience='ADMIN')
-- ----------------------------------------------------------------------------
UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('audience', 'ADMIN')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND code_value = 'DEPOSIT_PENDING_REMINDER';

-- ----------------------------------------------------------------------------
-- 3) trigger (발송 조건) 메타 신설 — 어드민 UI 에 '발송 조건: ...' 강조 노출용.
--    한글 자연어 — 어드민이 본문만 보지 않고도 트리거 즉시 파악 가능.
-- ----------------------------------------------------------------------------
UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '매칭 승인 직후 (계정 영구 1회)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'CLIENT_WELCOME_FIRST';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '상담이 취소될 때 (내담자/상담사 어느 쪽이든 취소 요청 시)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'CONSULTATION_CANCELLED';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '상담 일정이 확정될 때 (예약 확정 직후)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'CONSULTATION_CONFIRMED';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '상담 시작 1시간 전 (자동)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'CONSULTATION_REMINDER';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '결제 대기 매칭의 입금이 일정 시간 동안 미확인일 때 (관리자 대상)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'DEPOSIT_PENDING_REMINDER';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '첫 상담 일정이 등록될 때 (오프라인 매칭)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'INITIAL_GUIDE_OFFLINE';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '첫 상담 일정이 등록될 때 (온라인 매칭 — 화상 링크 포함)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'INITIAL_GUIDE_ONLINE';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '결제가 완료되었을 때')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'PAYMENT_COMPLETED';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '환불(전체/부분) 처리가 완료되었을 때')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'REFUND_COMPLETED';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '예약 시점이 D-2 이내일 때 즉시 예약 확정 알림 (다회기)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'RESERVATION_IMMEDIATE_LATE';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '단회기 매칭이 즉시 예약 확정될 때')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'RESERVATION_IMMEDIATE_SINGLE';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '상담일 2일 전 자동 예약 안내 (D-2 배치)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'RESERVATION_REMINDER_D2';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '확정된 상담 일정이 변경되었을 때')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'SCHEDULE_CHANGED';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '잔여 회기가 임계치 이하로 떨어졌을 때 (배치)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'SESSION_ENDING_SOON';

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('trigger', '회기 종결 후 갱신 유도 (마케팅 수신 동의자 한정)')
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE' AND tenant_id IS NULL AND code_value = 'SESSION_RENEW_PROMPT';
