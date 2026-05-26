package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 알림 자동 발송 스케줄러 ON/OFF 플래그 키 (system_config 전역 행).
 *
 * <p>운영 결정권자가 어드민/SQL 한 줄로 즉시 토글 가능하도록 SSOT 를 DB 플래그로 이관한다.
 * 기존 {@code @ConditionalOnProperty} 는 bean 등록 자체를 막는 ENV 가드로 유지하고,
 * 본 키들은 메서드 진입 시 런타임 가드로 사용한다 (이중 가드).
 *
 * <p>seed (초기 등록 — 멱등 INSERT, 운영 토글 결과 보존):
 * {@code src/main/resources/db/migration/V20260529_003__seed_notification_scheduler_flags.sql}.
 *
 * <p>안전망 (강제 false UPSERT — 2026-05-26 핫픽스):
 * {@code src/main/resources/db/migration/V20260530_003__notification_scheduler_flags_upsert.sql}.
 *
 * <p>스코프: 전역 단일 행({@code tenant_id = ''}) — 발송 스케줄러 토글은 트랜잭션성 채널이 아니라
 * 운영 발송 자체의 ON/OFF 이므로 테넌트별 분리가 의미 없음.
 *
 * <p><b>운영 안전 정책 (2026-05-26 갱신)</b>:
 * {@link #DEFAULT_ENABLED} 는 {@code false} (안전 차단). 시드 row 가 누락된 상태에서도
 * 자동 발송이 트리거되지 않도록 폴백 기본값을 보수적으로 운영한다.
 * 명시적 ON 은 운영 결정권자가 어드민 또는 SQL UPDATE 로 {@code config_value='true'} 를
 * 기록해야만 발화한다.
 *
 * <p>표준: {@code docs/standards/NOTIFICATION_SCHEDULER_SAFE_DEFAULT.md}.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
public final class NotificationSchedulerFlagKeys {

    /** 웰니스 팁 자동 발송 (09:00 KST) — {@code WellnessNotificationScheduler}. */
    public static final String WELLNESS_TIP_ENABLED =
            "notification.scheduler.wellness-tip.enabled";

    /** 상담일지 미작성 알림 (일/주/월) — {@code ConsultationRecordAlertScheduler}. */
    public static final String CONSULTATION_RECORD_ALERT_ENABLED =
            "notification.scheduler.consultation-record-alert.enabled";

    /** 워크플로우 자동화 4종 — {@code WorkflowAutomationServiceImpl}. */
    public static final String WORKFLOW_AUTOMATION_ENABLED =
            "notification.scheduler.workflow-automation.enabled";

    /** 예약 D-2 안내 일괄 발송 (09:00 KST) — {@code ReservationReminderScheduler}. */
    public static final String RESERVATION_REMINDER_ENABLED =
            "notification.scheduler.reservation-reminder.enabled";

    /** 카테고리 (system_config.category) — 어드민 UI 그룹핑·시드 카테고리. */
    public static final String CATEGORY = "NOTIFICATION";

    /**
     * 시드 행 누락 시 폴백 기본값.
     *
     * <p><b>운영 안전 정책 (2026-05-26 핫픽스)</b>: {@code false} — 명시적 ON row 가 없으면 차단.
     * 과거 {@code true} 폴백 정책은 시드 누락 시 자동 발송이 발화하는 위험이 있었기 때문에
     * 안전 기본값으로 전환한다. ON 은 반드시 {@code system_config} 에 {@code config_value='true'}
     * 가 존재할 때만 발화한다 ({@code SystemConfigService#getGlobalBoolean} 참조).
     *
     * <p>비고: 본 상수는 {@code getGlobalBoolean(key, defaultValue)} 호출 시 두 번째 인자로만
     * 사용된다. DB 시드/UPSERT 는 {@code 'false'} 로 강제 (V20260530_003) — 동일 SSOT.
     */
    public static final boolean DEFAULT_ENABLED = false;

    private static final Set<String> ALL = Set.of(
            WELLNESS_TIP_ENABLED,
            CONSULTATION_RECORD_ALERT_ENABLED,
            WORKFLOW_AUTOMATION_ENABLED,
            RESERVATION_REMINDER_ENABLED);

    private NotificationSchedulerFlagKeys() {
    }

    /**
     * @return 4 종 스케줄러 플래그 키 전체 (어드민 UI / 시드 검증용)
     */
    public static Set<String> all() {
        return ALL;
    }
}
