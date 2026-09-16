package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;

/**
 * {@link MappingAssignmentStatus} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-16
 */
@DisplayName("MappingAssignmentStatus")
class MappingAssignmentStatusTest {

    @ParameterizedTest
    @EnumSource(value = MappingStatus.class, names = {
            "ACTIVE", "PENDING_PAYMENT", "PAYMENT_CONFIRMED"
    })
    @DisplayName("배정 상태로 취급")
    void isAssigned_trueForLiveStatuses(MappingStatus status) {
        assertThat(MappingAssignmentStatus.isAssigned(status)).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = MappingStatus.class, names = {
            "TERMINATED", "CANCELLED", "INACTIVE", "SUSPENDED", "SESSIONS_EXHAUSTED",
            "DEPOSIT_PENDING", "DEPOSIT_CONFIRMED"
    })
    @DisplayName("종료·비활성·입금 전용 상태는 배정 아님")
    void isAssigned_falseForNonLiveStatuses(MappingStatus status) {
        assertThat(MappingAssignmentStatus.isAssigned(status)).isFalse();
    }

    @ParameterizedTest
    @NullSource
    @DisplayName("null 은 배정 아님")
    void isAssigned_falseForNull(MappingStatus status) {
        assertThat(MappingAssignmentStatus.isAssigned(status)).isFalse();
    }

    @Test
    @DisplayName("enum 전 값 커버 — 누락 시 컴파일/파라미터 실패")
    void isAssigned_coversAllEnumValuesExplicitly() {
        for (MappingStatus status : MappingStatus.values()) {
            boolean assigned = MappingAssignmentStatus.isAssigned(status);
            boolean expected = status == MappingStatus.ACTIVE
                    || status == MappingStatus.PENDING_PAYMENT
                    || status == MappingStatus.PAYMENT_CONFIRMED;
            assertThat(assigned).as("%s", status).isEqualTo(expected);
        }
    }
}
