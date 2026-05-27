-- =============================================================================
-- SMS 자동 발송 2단계 게이트 — 글로벌 system_config + 종목별 extra_data.dispatch_enabled
--   (2026-05-27, 사용자 결정 — 옵션 C / 글로벌 + 종목별 2단계 게이트)
--
-- 배경:
--   • V20260603_001 로 SMS_TEMPLATE 시드 15종 is_active=TRUE 복원.
--   • 발송 자체는 본문 활성과 분리된 토글로 제어한다 — 사용자 결정 원문:
--       "TRUE 로 해주고 발송플래그값으로 발송 되고 안되고 하게 해줘" (옵션 C).
--   • 글로벌 게이트(전체 OFF/ON) + 종목별 게이트(개별 OFF/ON) 의 AND 결합.
--   • 운영 안전 기본값 — 둘 다 false (현재 P0 차단 상태와 동일).
--
-- 정책 (운영 안전 SSOT):
--   • 글로벌: system_config.notification.sms.auto-dispatch.enabled = 'false' (전역 row).
--       - tenant_id = ''  (V20260228_001 표준 — 빈 문자열).
--       - 어드민 글로벌 토글 (PATCH /api/v1/admin/sms-templates/global-dispatch) 로만 변경.
--   • 종목별: SMS_TEMPLATE 시드 15종 글로벌 row 의 extra_data JSON 에
--     dispatch_enabled: false 추가. 기존 category/variables/trigger/priority 키 보존.
--       - 어드민 종목별 토글 (PATCH /api/v1/admin/sms-templates/{key}/dispatch) 로만 변경.
--       - 테넌트 override row 가 있으면 그 row 의 extra_data.dispatch_enabled 우선.
--   • 자동 트리거 경로(NotificationServiceImpl/BatchNotificationDispatchServiceImpl) 는
--     SmsTemplateService.isAutoDispatchEnabledFor 호출로 양쪽 모두 ON 일 때만 발송.
--   • 우회 경로(어드민 수동 발송 + 인증 OTP) 는 SmsTemplateService 비경유 → 영향 없음.
--
-- 멱등성:
--   • Step 1 (system_config): INSERT … ON DUPLICATE KEY UPDATE — 기존 행 보존
--     (사용자 토글값 보존 정책 — V20260529_003 와 동일 패턴).
--     UNIQUE KEY: uk_system_config_tenant_key (tenant_id, config_key) — V20260228_001.
--   • Step 2 (extra_data): JSON_CONTAINS_PATH 로 dispatch_enabled 키 미존재 row 만
--     UPDATE — 재실행 시 0 row.
--
-- 슬롯:
--   • V20260603_002 = V20260603_001 다음.
--   • V20260528_003 (알림톡 검수 통과 시 사용 예약) 슬롯 미접촉.
--   • V20260602_001 (P0 차단 시드) 본문 미접촉 — Flyway 이력 보존.
--
-- 키 SSOT:
--   • com.coresolution.consultation.constant.SmsDispatchFlagKeys
--   • SMS_AUTO_DISPATCH_ENABLED = "notification.sms.auto-dispatch.enabled"
--   • EXTRA_KEY_DISPATCH_ENABLED = "dispatch_enabled"
--
-- 가드:
--   • mind_garden DB 미접촉.
--   • core_solution DB 단독 적용.
--
-- 검증 쿼리:
--   -- 글로벌 행:
--   SELECT config_key, config_value, updated_at FROM system_config
--    WHERE tenant_id='' AND config_key='notification.sms.auto-dispatch.enabled';
--   -- 기대: 1 행, config_value='false' (재시드 후에도 사용자 토글값 보존).
--
--   -- 종목별 플래그:
--   SELECT code_value,
--          JSON_EXTRACT(extra_data, '$.dispatch_enabled') AS dispatch_enabled
--     FROM common_codes
--    WHERE tenant_id IS NULL AND code_group='SMS_TEMPLATE'
--    ORDER BY sort_order;
--   -- 기대: 15 행, dispatch_enabled=false.
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- Step 1) 글로벌 토글 — system_config.notification.sms.auto-dispatch.enabled
--          기본값 false (운영 안전 정책).
--          기존 행 존재 시 사용자 토글값 보존 (description/category 만 표준화).
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES (
    '', 'notification.sms.auto-dispatch.enabled', 'false',
    '자동 SMS 발송 글로벌 게이트 (운영 안전 기본 false, 옵션 C 1/2 — 어드민 토글로 ON/OFF)',
    'NOTIFICATION',
    false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category    = 'NOTIFICATION',
    is_active   = 1,
    updated_at  = NOW();

-- ──────────────────────────────────────────────────────────────────────────────
-- Step 2) 종목별 토글 — SMS_TEMPLATE 시드 15종 extra_data 에 dispatch_enabled=false 추가.
--          기존 category/variables/trigger/priority 키는 JSON_SET 으로 보존된다.
--          멱등 조건: dispatch_enabled 키 미존재 시에만 UPDATE.
--          MySQL 8+ JSON_CONTAINS_PATH('one') 사용.
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE common_codes
SET extra_data = JSON_SET(
        COALESCE(extra_data, JSON_OBJECT()),
        '$.dispatch_enabled', FALSE
    ),
    updated_at = NOW()
WHERE code_group = 'SMS_TEMPLATE'
  AND tenant_id IS NULL
  AND (
      extra_data IS NULL
      OR JSON_CONTAINS_PATH(extra_data, 'one', '$.dispatch_enabled') = 0
  );
