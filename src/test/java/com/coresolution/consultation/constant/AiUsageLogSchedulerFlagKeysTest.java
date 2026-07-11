package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link AiUsageLogSchedulerFlagKeys} 상수 검증.
 *
 * @author CoreSolution
 * @since 2026-07-11
 */
@DisplayName("AiUsageLogSchedulerFlagKeys")
class AiUsageLogSchedulerFlagKeysTest {

    @Test
    @DisplayName("DEFAULT_ENABLED 는 false — 시드 누락 시 안전 차단")
    void defaultEnabled_isFalse() {
        assertThat(AiUsageLogSchedulerFlagKeys.DEFAULT_ENABLED).isFalse();
    }

    @Test
    @DisplayName("키·카테고리 네임스페이스는 Flyway 시드와 일치")
    void keyAndCategory_matchSeed() {
        assertThat(AiUsageLogSchedulerFlagKeys.ENABLED)
                .isEqualTo("ai.usage-log.scheduler.enabled");
        assertThat(AiUsageLogSchedulerFlagKeys.CATEGORY).isEqualTo("AI_MONITORING");
    }
}
