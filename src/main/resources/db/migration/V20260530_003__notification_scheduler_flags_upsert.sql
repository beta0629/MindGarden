-- =============================================================================
-- system_config — 알림 자동 발송 스케줄러 ON/OFF 플래그 4종 안전망 UPSERT
--   (2026-05-26, 핫픽스 / wellness-tip 자동 발송 차단)
--
-- 배경:
--   • 2026-05-26 09:00 KST wellness-tip 자동 발송 1건이 운영에서 발화함.
--   • 원인 분석 (Agent f5c54b54):
--       1) system_config 의 wellness-tip.enabled row 가 누락되었거나 'true' 잔존.
--       2) NotificationSchedulerFlagKeys.DEFAULT_ENABLED = true 폴백 (누락 시 자동 ON).
--       3) V20260529_003 시드가 INSERT … WHERE NOT EXISTS 패턴이라 운영 row 잔존 시
--          시드만으로는 'false' 로 강제 갱신할 방법이 없었음.
--   • 의사결정 (사용자 컨펌):
--       - DEFAULT_ENABLED → false (코드 폴백 안전 차단).
--       - 본 시드는 4행 전체를 ON DUPLICATE KEY UPDATE 로 강제 false 로 일관 정렬.
--       - 본 시드 적용 후 운영 ON 은 어드민/SQL UPDATE 한 줄로만 가능.
--
-- 정책 (운영 안전 SSOT):
--   • 본 마이그레이션은 4 종 플래그 모두 강제 false 로 정렬한다.
--   • V20260529_003 시드는 그대로 보존 (이미 정착, 멱등 INSERT 동작).
--   • 본 시드는 1 회성 안전망 — Flyway 적용 후 운영 결정권자가 어드민으로
--     필요한 키만 다시 'true' 로 ON 할 수 있다.
--   • 신규 스케줄러 추가 시 동일 패턴 시드 작성 (docs/standards/NOTIFICATION_SCHEDULER_SAFE_DEFAULT.md).
--
-- 스키마 검증:
--   • UNIQUE KEY: uk_system_config_tenant_key (tenant_id, config_key) — V20260228_001.
--   • 전역 행은 tenant_id = '' (빈 문자열, NULL 아님) 표준 — V20260228_001 step 2.
--   • 따라서 ON DUPLICATE KEY UPDATE 가 빈 문자열 + config_key 매칭으로 정상 동작.
--
-- 슬롯:
--   • V20260530_003 = LNB 시드(V20260530_001/002) 다음 슬롯.
--   • V20260528_003 (미적용 슬롯) 보존.
--   • V20260529_003 시드 보존 (수정 금지).
--
-- 키 SSOT: com.coresolution.consultation.constant.NotificationSchedulerFlagKeys
--
-- 운영 재개 절차 (배포 후):
--   1) 운영 결정권자가 어드민 UI 로 활성화하려는 키만 ON.
--   2) 또는 SQL:
--      UPDATE system_config SET config_value='true', updated_by='<admin>'
--       WHERE tenant_id='' AND config_key='notification.scheduler.<NAME>.enabled';
--
-- 검증 쿼리 (배포 직후):
--   SELECT config_key, config_value, updated_at, updated_by
--     FROM system_config
--    WHERE tenant_id = '' AND category = 'NOTIFICATION'
--      AND config_key LIKE 'notification.scheduler.%'
--    ORDER BY config_key;
--   -- 기대: 4 행, config_value='false', updated_by='system-hotfix-20260526'.
-- =============================================================================

-- 4 행 UPSERT — INSERT 누락 시 신규 등록 / 존재 시 false 강제 갱신.
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'notification.scheduler.wellness-tip.enabled', 'false',
     '웰니스 일일 팁 자동 발송 ON/OFF (운영 안전 기본 false, 핫픽스 20260526)', 'NOTIFICATION',
     false, true, 'SYSTEM', 'system-hotfix-20260526', NOW(), NOW()),
    ('', 'notification.scheduler.consultation-record-alert.enabled', 'false',
     '상담 일지 미작성 알림 스케줄러 자동 발송 ON/OFF (운영 안전 기본 false, 핫픽스 20260526)', 'NOTIFICATION',
     false, true, 'SYSTEM', 'system-hotfix-20260526', NOW(), NOW()),
    ('', 'notification.scheduler.workflow-automation.enabled', 'false',
     '워크플로우 자동화 스케줄러 자동 발송 ON/OFF (운영 안전 기본 false, 핫픽스 20260526)', 'NOTIFICATION',
     false, true, 'SYSTEM', 'system-hotfix-20260526', NOW(), NOW()),
    ('', 'notification.scheduler.reservation-reminder.enabled', 'false',
     '예약 리마인더 스케줄러 자동 발송 ON/OFF (운영 안전 기본 false, 핫픽스 20260526)', 'NOTIFICATION',
     false, true, 'SYSTEM', 'system-hotfix-20260526', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    config_value = 'false',
    is_active    = 1,
    description  = VALUES(description),
    category     = 'NOTIFICATION',
    updated_at   = NOW(),
    updated_by   = 'system-hotfix-20260526';
