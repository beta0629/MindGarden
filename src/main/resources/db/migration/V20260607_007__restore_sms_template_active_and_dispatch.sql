-- =============================================================================
-- SMS_TEMPLATE 글로벌 시드 15종 — is_active=1 + extra_data.dispatch_enabled=true 일괄 복구
-- 2026-06-02 사용자 P0 보고: "일정변경은 문자 안나가"
--
-- 배경:
--   • PR #9 (SMS P0 영구 차단 Phase 2, V20260602_001) 가 SMS_TEMPLATE 시드 15종
--     모두 is_active=0 으로 차단. 이후 사용자 결정 "알림톡 안 쓰고 SMS 만" 정책
--     으로 SMS 부활 의도가 명시됐으나, 글로벌 시드 dispatch_enabled=false 는 해제
--     되지 않은 상태로 남아 운영 SMS 자동 발송이 전부 차단되어 있었음.
--   • 인천 테넌트 override 11종은 is_active=1 (어드민 UI 에서 활성화) 인데
--     extra_data.dispatch_enabled 키는 NULL — NotificationServiceImpl 의
--     SmsTemplateService.isAutoDispatchEnabledFor() 가 글로벌 default(false) 로
--     fallback 하여 종목별 게이트가 차단 → SCHEDULE_CHANGED 외 14종 모두 미발송.
--
-- 운영 실측 (2026-06-02 21:00 KST):
--   • 활성 사용자 = 인천 28명 (다른 테넌트 0명) → 글로벌 default true 의 영향 범위
--     실질적으로 인천 한 곳.
--   • notification.sms.auto-dispatch.enabled=true (글로벌 게이트 ON).
--
-- 변경:
--   1) is_active=1 일괄 복구 (Phase 2 차단 해제) — V20260603_001 의 활성 복구를
--      이행하는 보강. is_active=0 잔존 row 만 갱신.
--   2) extra_data.dispatch_enabled=true 일괄 머지 — 종목별 게이트 default 활성.
--      기존 키(category/audience/trigger/variables 등) 보존.
--
-- 멱등성:
--   • is_active=1 강제 (이미 1 이면 NO-OP).
--   • JSON_MERGE_PATCH 로 dispatch_enabled=true 머지 (이미 true 면 동등 결과).
--
-- 멀티테넌트 가드:
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL 글로벌만 변경.
--   • 인천 override (tenant_id IS NOT NULL) 은 본 마이그에서 미접촉 — 현재 상태로도
--     글로벌 fallback 으로 SMS 발송 정상화됨 (isAutoDispatchEnabledFor 의 tenant
--     dispatch_enabled NULL → 글로벌 사용 로직).
--
-- 안전망:
--   • 알림톡 검수 통과 후에는 알림톡 우선 발송 (KAKAO_ALIMTALK_ENABLED=true) →
--     SMS 는 fallback 으로만 사용 → 본 변경의 SMS 비용 영향 최소.
--   • 어드민 UI 에서 종목별 토글로 운영자가 즉시 OFF 가능.
-- =============================================================================

UPDATE common_codes
SET is_active = 1,
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND is_active = 0;

UPDATE common_codes
SET extra_data = JSON_MERGE_PATCH(
        COALESCE(extra_data, JSON_OBJECT()),
        JSON_OBJECT('dispatch_enabled', TRUE)
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND (
      extra_data IS NULL
      OR JSON_EXTRACT(extra_data, '$.dispatch_enabled') IS NULL
      OR JSON_UNQUOTE(JSON_EXTRACT(extra_data, '$.dispatch_enabled')) <> 'true'
  );

-- 영향 받는 시드 (운영 DB 2026-06-02 실측 15종):
--   CLIENT_WELCOME_FIRST · CONSULTATION_CANCELLED · CONSULTATION_CONFIRMED ·
--   CONSULTATION_REMINDER · DEPOSIT_PENDING_REMINDER · INITIAL_GUIDE_OFFLINE ·
--   INITIAL_GUIDE_ONLINE · PAYMENT_COMPLETED · REFUND_COMPLETED ·
--   RESERVATION_IMMEDIATE_LATE · RESERVATION_IMMEDIATE_SINGLE ·
--   RESERVATION_REMINDER_D2 · SCHEDULE_CHANGED · SESSION_ENDING_SOON ·
--   SESSION_RENEW_PROMPT
--
-- 검증 쿼리 (적용 후):
--   SELECT code_value, is_active,
--          JSON_UNQUOTE(JSON_EXTRACT(extra_data, '$.dispatch_enabled')) AS dispatch
--   FROM common_codes
--   WHERE code_group='SMS_TEMPLATE' AND tenant_id IS NULL;
--   → 15종 모두 is_active=1, dispatch=true 확인.
