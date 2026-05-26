package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * {@link NotificationSchedulerFlagKeys} 상수 / 정책 검증.
 *
 * <p>2026-05-26 핫픽스 이후 안전 기본값({@code DEFAULT_ENABLED = false}) 와
 * 키 SSOT 집합 무결성을 회귀 차단한다.
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@DisplayName("NotificationSchedulerFlagKeys — 운영 안전 정책")
class NotificationSchedulerFlagKeysTest {

    @Nested
    @DisplayName("DEFAULT_ENABLED 안전 기본값")
    class DefaultEnabledPolicy {

        @Test
        @DisplayName("DEFAULT_ENABLED 는 false — 시드 누락 시 안전 차단 정책 (운영 결정 2026-05-26)")
        void defaultEnabled_isFalse() {
            assertThat(NotificationSchedulerFlagKeys.DEFAULT_ENABLED)
                    .as("운영 안전 정책: 명시적 ON row 가 없으면 차단. true 로 회귀 금지.")
                    .isFalse();
        }
    }

    @Nested
    @DisplayName("키 SSOT 집합 무결성")
    class KeySetIntegrity {

        @Test
        @DisplayName("ALL() 은 4 종 스케줄러 키를 모두 포함한다")
        void all_containsFourKeys() {
            assertThat(NotificationSchedulerFlagKeys.all())
                    .hasSize(4)
                    .containsExactlyInAnyOrder(
                            NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                            NotificationSchedulerFlagKeys.CONSULTATION_RECORD_ALERT_ENABLED,
                            NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED,
                            NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED);
        }

        @Test
        @DisplayName("키 네임스페이스는 시드 / DB UPSERT 와 정확히 일치한다")
        void keyNamespaces_matchSeed() {
            assertThat(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED)
                    .isEqualTo("notification.scheduler.wellness-tip.enabled");
            assertThat(NotificationSchedulerFlagKeys.CONSULTATION_RECORD_ALERT_ENABLED)
                    .isEqualTo("notification.scheduler.consultation-record-alert.enabled");
            assertThat(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED)
                    .isEqualTo("notification.scheduler.workflow-automation.enabled");
            assertThat(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED)
                    .isEqualTo("notification.scheduler.reservation-reminder.enabled");
        }

        @Test
        @DisplayName("CATEGORY = NOTIFICATION (시드 카테고리와 일치)")
        void category_isNotification() {
            assertThat(NotificationSchedulerFlagKeys.CATEGORY).isEqualTo("NOTIFICATION");
        }
    }
}
