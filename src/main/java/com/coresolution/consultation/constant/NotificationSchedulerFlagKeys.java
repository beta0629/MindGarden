package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 알림 자동 발송 스케줄러 ON/OFF 플래그 키 (system_config 전역 행).
 *
 * <p>운영 결정권자가 어드민/SQL 한 줄로 즉시 토글 가능하도록 SSOT 를 DB 플래그로 이관한다.
 * 기존 {@code @ConditionalOnProperty} 는 bean 등록 자체를 막는 ENV 가드로 유지하고,
 * 본 키들은 메서드 진입 시 런타임 가드로 사용한다 (이중 가드).
 *
 * <p>seed: {@code src/main/resources/db/migration/V20260529_003__seed_notification_scheduler_flags.sql}
 * (멱등 — 사용자 토글 결과 덮어쓰기 금지)
 *
 * <p>스코프: 전역 단일 행({@code tenant_id = ''}) — 발송 스케줄러 토글은 트랜잭션성 채널이 아니라
 * 운영 발송 자체의 ON/OFF 이므로 테넌트별 분리가 의미 없음.
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

    /** 기본값 — 시드/조회 모두 동일. 운영 정책: 명시적 OFF 가 없으면 ON 유지. */
    public static final boolean DEFAULT_ENABLED = true;

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
