-- =============================================================================
-- SMS 발송 P0 긴급 차단 (2026-05-26, 사용자 결정 — Phase 2 영구 안전망)
--
-- 배경:
--   • V20260528_002 (알림톡 8종 is_active=FALSE — 솔라피 검수 대기)
--   • V20260529_004 (SMS_TEMPLATE 15종 시드 적용)
--   • 위 두 변경 조합으로 모든 이벤트 트리거가 알림톡 매핑 null →
--     F1+F3 정책에 따라 SMS 폴백 발화 (12 케이스 관측).
--   • Phase 1 (systemd `SMS_AUTH_ENABLED=false`) 으로 즉시 차단했으나
--     환경변수 복원 시 재발 위험 — 본 마이그레이션으로 코드 경로에서도 차단.
--
-- 정책:
--   • SmsTemplateService.findCoreCodeByGroupAndValue/findTenantCodeByGroupAndValue
--     모두 JPA 쿼리에서 `AND c.isActive = true` 를 강제하므로,
--     글로벌(tenant_id IS NULL) 시드의 is_active=FALSE 만으로
--     NotificationServiceImpl.buildSmsMessage 가 null 반환 → SMS skip 으로 이어진다.
--   • 배치 경로(BatchNotificationDispatchServiceImpl) 는 본 PR 의 코드 변경
--     (notification.batch.sms-static-fallback-enabled=false 기본) 으로 동일하게 skip.
--   • 인증 SMS (SmsAuthService.sendVerificationCode) 는 SMS_TEMPLATE 미사용 →
--     본 시드 변경의 영향을 받지 않는다.
--
-- 멱등성:
--   • `is_active = TRUE` 조건을 WHERE 절에 포함 — 재실행 시 0 row UPDATE.
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL 만 다룬다(글로벌 시드 한정).
--   • 테넌트 override (tenant_id IS NOT NULL) 는 어드민 UI 운영 자산이므로 미접촉.
--
-- 멀티테넌트 격리:
--   • code_group='SMS_TEMPLATE' AND tenant_id IS NULL — 코어솔루션 글로벌 시드만 비활성.
--   • 테넌트 override 가 활성 상태라면 그 본문은 계속 사용되지만,
--     호출자(NotificationServiceImpl/BatchNotificationDispatchServiceImpl) 는
--     글로벌 fallback 도 함께 조회하지 않으므로 결과적으로 영향 없음
--     (테넌트 override 활성 → 그 본문으로 SMS 발송 가능). 본 P0 차단의 의도는
--     운영 테넌트 전 범위 SMS 차단이므로, 운영 환경 검증 시 테넌트 override 시드가
--     없는지 추가 확인 필요.
--
-- 복원 절차 (Phase 3):
--   • 알림톡 8종 솔라피 검수 통과 후 별도 Flyway (예: V20260528_003 또는 V202606XX) 로
--     V20260528_002 의 is_active=TRUE 복원 + 본 시드의 is_active=TRUE 복원.
--   • 또는 어드민 SMS_TEMPLATE 콘솔 (V20260526_001/002/004 LNB 메뉴) 로
--     테넌트 override 신규 활성화 정책 운영.
--
-- 가드:
--   • V20260528_003 슬롯 미사용(예약).
--   • mind_garden DB 미접촉.
--   • core_solution DB 단독 적용.
-- =============================================================================

UPDATE common_codes
SET is_active = FALSE,
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND is_active = TRUE;

-- 영향 받는 시드 예상 (15종 — V20260529_004 시드 기준):
--   A) NotificationServiceImpl 트랜잭션 7종:
--      CONSULTATION_CONFIRMED, CONSULTATION_REMINDER, CONSULTATION_CANCELLED,
--      REFUND_COMPLETED, SCHEDULE_CHANGED, PAYMENT_COMPLETED, DEPOSIT_PENDING_REMINDER
--   B) BatchNotificationDispatchServiceImpl 배치 8종:
--      RESERVATION_REMINDER_D2, RESERVATION_IMMEDIATE_SINGLE, RESERVATION_IMMEDIATE_LATE,
--      SESSION_ENDING_SOON, SESSION_RENEW_PROMPT, CLIENT_WELCOME_FIRST,
--      INITIAL_GUIDE_OFFLINE, INITIAL_GUIDE_ONLINE
