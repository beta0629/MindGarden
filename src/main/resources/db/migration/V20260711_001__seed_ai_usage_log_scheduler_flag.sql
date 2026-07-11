-- =============================================================================
-- system_config — AI 사용 로그(힐링 생성) 스케줄러 플래그 시드
--   (2026-07-11, 로컬 AI 모니터링 — 알림 발송과 분리)
--
-- 배경:
--   • notification.scheduler.wellness-tip.enabled=false 핫픽스 이후
--     WellnessNotificationScheduler early return → ai_usage_logs 적재 중단.
--   • 힐링 생성/로그 적재와 알림 발송을 분리하기 위해 본 플래그를 추가.
--
-- 정책:
--   • 기본값 false (안전). prod 에서 wellness-tip 무단 ON 금지.
--   • DEV 에서만 모니터링 목적로 본 키를 true 로 토글:
--       UPDATE system_config
--          SET config_value='true', updated_by='dev-ai-monitor'
--        WHERE tenant_id='' AND config_key='ai.usage-log.scheduler.enabled';
--
-- 키 SSOT: com.coresolution.consultation.constant.AiUsageLogSchedulerFlagKeys
-- =============================================================================

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'ai.usage-log.scheduler.enabled', 'false',
     '힐링 컨텐츠 생성(AI 사용 로그 적재) 스케줄러 ON/OFF — 알림 발송과 분리. DEV 모니터링용. 기본 false',
     'AI_MONITORING',
     false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    updated_at = NOW();
