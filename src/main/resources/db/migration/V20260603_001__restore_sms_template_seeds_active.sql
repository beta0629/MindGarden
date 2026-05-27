-- =============================================================================
-- SMS_TEMPLATE — 글로벌 시드 is_active=TRUE 복원 (V20260602_001 의 역작용)
--   (2026-05-27, 사용자 결정 — 옵션 C / 2단계 게이트 도입에 따른 시드 정상화)
--
-- 배경:
--   • V20260602_001 (2026-05-26 19:04 KST 운영 반영) 은 SMS_TEMPLATE 글로벌 시드 15종
--     의 is_active=FALSE 로 강제하여 자동 트리거 SMS 12 케이스 발화를 즉시 차단했다.
--     알림톡 8종이 솔라피 검수 중인 사이의 임시 안전망이었다.
--   • 사용자 결정 (2026-05-27) — 원문 인용:
--       "TRUE 로 해주고 발송플래그값으로 발송 되고 안되고 하게 해줘"
--       + 옵션 C (글로벌 + 종목별 2단계 게이트) 확정.
--   • 시드 비활성을 정상 운영 SSOT 로 두지 않는다. 본문 자체는 활성으로 복원하고,
--     발송 자체는 별도 system_config 플래그(notification.sms.auto-dispatch.enabled)
--     + extra_data.dispatch_enabled 로 제어한다 (V20260603_002).
--
-- 정책:
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL — 글로벌 시드 15종 한정.
--   • is_active=FALSE 인 row 만 TRUE 로 갱신 — 사용자/Flyway 가 의도적으로 비활성화한
--     테넌트 row 는 영향 없음.
--   • 본 마이그레이션 적용 후에도 게이트(V20260603_002 시드 + 코드 게이트)가 OFF 면
--     실제 자동 SMS 는 0건이며, 어드민 토글 ON 시점에만 발화한다.
--
-- 멱등성:
--   • WHERE 절에 is_active = FALSE 강제 — 재실행 시 0 row UPDATE.
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL 만 다룬다(글로벌 시드 한정).
--   • 테넌트 override (tenant_id IS NOT NULL) 는 어드민 UI 자산이므로 미접촉.
--
-- 멀티테넌트 격리:
--   • V20260602_001 과 동일하게 글로벌(tenant_id IS NULL) 시드만 다룬다.
--   • mind_garden DB 미접촉 — core_solution 단독.
--
-- 가드:
--   • V20260528_003 (알림톡 검수 통과 후 활성화 PR) 슬롯 보존 — 본 PR 미접촉.
--   • V20260602_001 시드 본문 (이력) 절대 수정/롤백 금지 — Flyway 이력 보존.
--   • mind_garden 스키마·branch_code 미접촉.
--
-- 검증 쿼리:
--   SELECT code_value, is_active, updated_at FROM common_codes
--    WHERE tenant_id IS NULL AND code_group='SMS_TEMPLATE'
--    ORDER BY sort_order;
--   -- 기대: 15 행, is_active=1 (=TRUE).
-- =============================================================================

UPDATE common_codes
SET is_active = TRUE,
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND is_active = FALSE;

-- 영향 받는 시드 (V20260529_004 시드 기준 15종):
--   A) NotificationServiceImpl 트랜잭션 7종:
--      CONSULTATION_CONFIRMED, CONSULTATION_REMINDER, CONSULTATION_CANCELLED,
--      REFUND_COMPLETED, SCHEDULE_CHANGED, PAYMENT_COMPLETED, DEPOSIT_PENDING_REMINDER
--   B) BatchNotificationDispatchServiceImpl 배치 8종:
--      RESERVATION_REMINDER_D2, RESERVATION_IMMEDIATE_SINGLE, RESERVATION_IMMEDIATE_LATE,
--      SESSION_ENDING_SOON, SESSION_RENEW_PROMPT, CLIENT_WELCOME_FIRST,
--      INITIAL_GUIDE_OFFLINE, INITIAL_GUIDE_ONLINE
