package com.coresolution.consultation.constant;

/**
 * AI 사용 로그(힐링 컨텐츠 생성) 스케줄러 ON/OFF 플래그 키.
 *
 * <p>웰니스 <b>알림 발송</b>({@link NotificationSchedulerFlagKeys#WELLNESS_TIP_ENABLED}) 과
 * 분리한다. 알림 OFF 상태에서도 모니터링용 {@code ai_usage_logs} 적재를 위해
 * 힐링 컨텐츠 생성만 돌릴 수 있다.</p>
 *
 * <p><b>운영 안전</b>: 기본값 {@code false}. prod 에서
 * {@code notification.scheduler.wellness-tip.enabled=true} 무단 ON 금지(알림 스팸).
 * 본 플래그는 알림을 보내지 않으며, <b>dev 전용으로 SQL 토글</b>하는 것을 권장한다.</p>
 *
 * <pre>
 * -- DEV ONLY (prod 무단 ON 금지 — wellness-tip 과 혼동 금지)
 * UPDATE system_config
 *    SET config_value = 'true', updated_by = 'dev-ai-monitor'
 *  WHERE tenant_id = ''
 *    AND config_key = 'ai.usage-log.scheduler.enabled';
 * </pre>
 *
 * @author CoreSolution
 * @since 2026-07-11
 */
public final class AiUsageLogSchedulerFlagKeys {

    /**
     * 힐링 컨텐츠 생성(및 AI 사용 로그 적재) 스케줄러 ON/OFF.
     * 알림 발송과 무관.
     */
    public static final String ENABLED = "ai.usage-log.scheduler.enabled";

    /** system_config.category */
    public static final String CATEGORY = "AI_MONITORING";

    /**
     * 시드 누락 시 폴백 — 안전 차단(false).
     * 명시적 ON row 가 있을 때만 힐링 생성 스케줄러가 동작한다.
     */
    public static final boolean DEFAULT_ENABLED = false;

    private AiUsageLogSchedulerFlagKeys() {
    }
}
