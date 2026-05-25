-- =============================================================================
-- system_config — 알림 자동 발송 스케줄러 ON/OFF 플래그 4종 전역 시드
--   (2026-05-25, 운영 결정권자 컨펌 / SSOT 를 ENV 에서 DB 로 이관)
--
-- 배경:
--   • V20260524 ENV `SCHEDULER_*_ENABLED=false` 가 운영(648633a9)·개발(c46bb9dd)
--     에 즉시 적용되어 4종 스케줄러를 비활성화함 (임시 조치).
--   • 영구 SSOT 는 DB 플래그 — 어드민/SQL UPDATE 1회로 즉시 ON/OFF 가능해야 함.
--   • Java 측 `@ConditionalOnProperty(matchIfMissing=true)` 는 그대로 유지하여
--     ENV 가 명시적으로 false 면 bean 등록 차단 (이중 가드).
--   • 본 시드는 4 개 키를 default true (=ON) 로 등록한다. 운영 ENV 해제(별도
--     deployer 위임) 후에는 이 DB 플래그가 단일 SSOT 로 동작한다.
--
-- 정책: 전역 단일 플래그 (tenant_id = '')
--   • system_config 의 기존 표준화(V20260228_001) — 전역 행은 tenant_id 빈 문자열.
--   • 발송 스케줄러 토글은 운영 전역 동작이므로 테넌트별 분리 의미 없음.
--   • 신규 테넌트가 추가돼도 본 4 행은 그대로 유효 (추가 시드 불필요).
--
-- 멱등성:
--   • INSERT … WHERE NOT EXISTS — 기존 행이 있으면 NO-OP (사용자 토글값 보존).
--   • 본 시드는 절대 UPDATE 하지 않는다 (운영 결정권자가 끄려고 false 로 바꿔둔
--     상태에서 재배포 시 자동으로 true 로 되돌아가는 사고 차단).
--
-- 슬롯:
--   • 본 마이그레이션 = V20260529_003.
--   • V20260528_003 (솔라피) 미적용 보존 — 본 슬롯과 충돌 없음.
--   • V20260529_001 (ai_usage_logs N3) / V20260529_002 (회전 풀 8종 시드) 와 별개.
--
-- 키 SSOT: com.coresolution.consultation.constant.NotificationSchedulerFlagKeys
--
-- 운영 토글 (배포 후 즉시 적용):
--   UPDATE system_config SET config_value = 'false', updated_by = '<admin>'
--    WHERE tenant_id = '' AND config_key = 'notification.scheduler.wellness-tip.enabled';
--   -- 켜기는 'true'.
--
-- 검증 쿼리:
--   SELECT config_key, config_value, category, updated_at, updated_by
--     FROM system_config
--    WHERE tenant_id = '' AND category = 'NOTIFICATION'
--      AND config_key LIKE 'notification.scheduler.%'
--    ORDER BY config_key;
--   -- 기대: 4 행, config_value = 'true' (재시드 후에도 사용자 토글값 보존).
-- =============================================================================

-- 1) 웰니스 팁 자동 발송 (09:00 KST) — WellnessNotificationScheduler
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    '', 'notification.scheduler.wellness-tip.enabled', 'true',
    '웰니스 팁 자동 발송 ON/OFF (전역, 09:00 KST)', 'NOTIFICATION',
    false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
     WHERE tenant_id = ''
       AND config_key = 'notification.scheduler.wellness-tip.enabled'
);

-- 2) 상담일지 미작성 알림 (일/주/월) — ConsultationRecordAlertScheduler
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    '', 'notification.scheduler.consultation-record-alert.enabled', 'true',
    '상담일지 미작성 알림 ON/OFF (전역, 일/주/월 배치)', 'NOTIFICATION',
    false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
     WHERE tenant_id = ''
       AND config_key = 'notification.scheduler.consultation-record-alert.enabled'
);

-- 3) 워크플로우 자동화 4종 — WorkflowAutomationServiceImpl
--    sendScheduleReminders / sendIncompleteConsultationAlerts /
--    sendDailyPerformanceSummary / generateMonthlyPerformanceReport
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    '', 'notification.scheduler.workflow-automation.enabled', 'true',
    '워크플로우 자동화 4종 ON/OFF (전역, 예약 리마인더/미완료 알림/일·월간 성과)', 'NOTIFICATION',
    false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
     WHERE tenant_id = ''
       AND config_key = 'notification.scheduler.workflow-automation.enabled'
);

-- 4) 예약 D-2 안내 일괄 발송 (09:00 KST) — ReservationReminderScheduler
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    '', 'notification.scheduler.reservation-reminder.enabled', 'true',
    '예약 D-2 안내 일괄 발송 ON/OFF (전역, 09:00 KST)', 'NOTIFICATION',
    false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
     WHERE tenant_id = ''
       AND config_key = 'notification.scheduler.reservation-reminder.enabled'
);
