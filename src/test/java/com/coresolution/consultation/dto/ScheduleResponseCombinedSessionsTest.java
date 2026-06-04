package com.coresolution.consultation.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ScheduleResponse#applyCombinedSessions(Long, Integer, Integer, Integer)} 합산 로직 단위 테스트.
 *
 * <p>위임자 시나리오:
 * <ul>
 *   <li>pastSessionCount=null + sequence=6/total=20 → combinedUsed=6, combinedTotal=20 (신규 내담자)</li>
 *   <li>pastSessionCount=5 + sequence=6/total=20 → combinedUsed=11, combinedTotal=25</li>
 *   <li>pastSessionCount=10 + total=20 → combinedTotal=30</li>
 *   <li>단회기(total=1) → 합산 미노출</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@DisplayName("ScheduleResponse#applyCombinedSessions")
class ScheduleResponseCombinedSessionsTest {

    @Test
    @DisplayName("pastSessionCount null + sessionSequence 우선 → 합산 사용 = sequence (신규 내담자 정책)")
    void pastSessionCountNull_treatedAsZero() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(null, 20, 14, 6);

        assertThat(response.getPastSessionCount()).isNull();
        assertThat(response.getCombinedUsedSessions()).isEqualTo(6L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(20L);
    }

    @Test
    @DisplayName("pastSessionCount=5, sessionSequence=6, total=20 → used=11, total=25 (사용자 시나리오)")
    void pastFivePlusSequenceSix_returnsElevenAndTwentyFive() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(5L, 20, 14, 6);

        assertThat(response.getPastSessionCount()).isEqualTo(5L);
        assertThat(response.getCombinedUsedSessions()).isEqualTo(11L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(25L);
    }

    @Test
    @DisplayName("pastSessionCount=10, total=20, sequence=null, remaining=15 → used=10+5=15, total=30")
    void pastTenWithRemainingFallback_returnsCombinedFifteenAndThirty() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(10L, 20, 15, null);

        assertThat(response.getCombinedUsedSessions()).isEqualTo(15L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(30L);
    }

    @Test
    @DisplayName("단회기(total=1) 도 합산 표시 (사용자 요구 '누적과 잔여 둘 다 노출')")
    void singleSession_combinesPastAndUsed() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(5L, 1, 0, 1);

        assertThat(response.getCombinedUsedSessions()).isEqualTo(6L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(6L);
    }

    @Test
    @DisplayName("total=null → 합산 모두 null")
    void totalSessionsNull_returnsNullCombinedValues() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(5L, null, null, null);

        assertThat(response.getCombinedUsedSessions()).isNull();
        assertThat(response.getCombinedTotalSessions()).isNull();
    }

    @Test
    @DisplayName("sessionSequence 가 total 을 초과해도 total 로 clamp 한 뒤 합산")
    void sessionSequenceExceedsTotal_clampsToTotal() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(5L, 10, 0, 99);

        assertThat(response.getCombinedUsedSessions()).isEqualTo(15L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(15L);
    }

    @Test
    @DisplayName("음수 pastSessionCount 는 0 으로 안전 처리 (DB 가드 보강)")
    void negativePastSessionCount_treatedAsZero() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(-3L, 10, 5, 5);

        assertThat(response.getPastSessionCount()).isEqualTo(-3L);
        assertThat(response.getCombinedUsedSessions()).isEqualTo(5L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(10L);
    }

    @Test
    @DisplayName("sequence·remaining 둘 다 부족 → used=past+0 (안전 fallback)")
    void noSequenceAndNoRemaining_usedFallsBackToPast() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(4L, 20, null, null);

        assertThat(response.getCombinedUsedSessions()).isEqualTo(4L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(24L);
    }

    @Test
    @DisplayName("pastSessionCount 0 (명시적 0회 외부 이력) 도 정상 합산")
    void pastSessionCountZero_treatedSameAsNull() {
        ScheduleResponse response = ScheduleResponse.builder().build();
        response.applyCombinedSessions(0L, 10, 5, 5);

        assertThat(response.getPastSessionCount()).isEqualTo(0L);
        assertThat(response.getCombinedUsedSessions()).isEqualTo(5L);
        assertThat(response.getCombinedTotalSessions()).isEqualTo(10L);
    }
}
