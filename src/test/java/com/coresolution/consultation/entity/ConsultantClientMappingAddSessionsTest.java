package com.coresolution.consultation.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 회기 추가 시 패키지 승계·가변 회기 합산 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-07-17
 */
@DisplayName("ConsultantClientMapping.addSessions — 패키지 유지·회기 합산")
class ConsultantClientMappingAddSessionsTest {

    @Test
    @DisplayName("패키지명·패키지가격·used는 유지하고 total/remaining만 +N")
    void addSessions_preservesPackageAndUsed_incrementsTotalRemaining() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPackageName("기본10회 + 심리검사");
        mapping.setPackagePrice(800_000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(3);
        mapping.setRemainingSessions(7);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        mapping.addSessions(5);

        assertThat(mapping.getPackageName()).isEqualTo("기본10회 + 심리검사");
        assertThat(mapping.getPackagePrice()).isEqualTo(800_000L);
        assertThat(mapping.getUsedSessions()).isEqualTo(3);
        assertThat(mapping.getTotalSessions()).isEqualTo(15);
        assertThat(mapping.getRemainingSessions()).isEqualTo(12);
    }

    @Test
    @DisplayName("PENDING 호환: 요청과 다른 금액이어도 매핑 가격은 덮어쓰지 않는다")
    void addSessions_doesNotOverwritePackagePriceFromRequestAmount() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPackageName("10회기 패키지");
        mapping.setPackagePrice(1_000_000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(10);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        mapping.addSessions(10);

        assertThat(mapping.getPackageName()).isEqualTo("10회기 패키지");
        assertThat(mapping.getPackagePrice()).isEqualTo(1_000_000L);
        assertThat(mapping.getTotalSessions()).isEqualTo(20);
        assertThat(mapping.getRemainingSessions()).isEqualTo(20);
    }

    @Test
    @DisplayName("기존 회기 수가 null이면 0으로 간주하여 합산")
    void addSessions_treatsNullSessionCountsAsZero() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();

        mapping.addSessions(5);

        assertThat(mapping.getTotalSessions()).isEqualTo(5);
        assertThat(mapping.getRemainingSessions()).isEqualTo(5);
    }

    @Test
    @DisplayName("추가 회기 수가 null이거나 1 미만이면 예외")
    void addSessions_rejectsInvalidCount() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(10);

        assertThatThrownBy(() -> mapping.addSessions(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("추가 회기 수는 1 이상이어야 합니다.");
        assertThatThrownBy(() -> mapping.addSessions(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("추가 회기 수는 1 이상이어야 합니다.");
        assertThatThrownBy(() -> mapping.addSessions(-1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("추가 회기 수는 1 이상이어야 합니다.");
    }

    @Test
    @DisplayName("전체 회기 합산이 정수 범위를 초과하면 기존 값을 유지하고 예외")
    void addSessions_rejectsTotalSessionsOverflowWithoutMutation() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(Integer.MAX_VALUE);
        mapping.setRemainingSessions(10);

        assertThatThrownBy(() -> mapping.addSessions(1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("회기 수 합산 결과가 허용 범위를 초과합니다.")
                .hasCauseInstanceOf(ArithmeticException.class);
        assertThat(mapping.getTotalSessions()).isEqualTo(Integer.MAX_VALUE);
        assertThat(mapping.getRemainingSessions()).isEqualTo(10);
    }

    @Test
    @DisplayName("잔여 회기 합산이 정수 범위를 초과하면 기존 값을 유지하고 예외")
    void addSessions_rejectsRemainingSessionsOverflowWithoutMutation() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(Integer.MAX_VALUE);

        assertThatThrownBy(() -> mapping.addSessions(1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("회기 수 합산 결과가 허용 범위를 초과합니다.")
                .hasCauseInstanceOf(ArithmeticException.class);
        assertThat(mapping.getTotalSessions()).isEqualTo(10);
        assertThat(mapping.getRemainingSessions()).isEqualTo(Integer.MAX_VALUE);
    }
}
