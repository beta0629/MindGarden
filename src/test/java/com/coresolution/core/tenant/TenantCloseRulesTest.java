package com.coresolution.core.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import com.coresolution.core.domain.Tenant.TenantStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 종료 상태 전이. 유예 경계와 유효 구독 유무를 포함한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("TenantCloseRules")
class TenantCloseRulesTest {

    private static final int GRACE_DAYS = TenantCloseProperties.DEFAULT_GRACE_DAYS;
    private static final LocalDateTime SUSPENDED_AT = LocalDateTime.of(2026, 1, 1, 0, 0);
    private static final LocalDateTime GRACE_ELAPSED = SUSPENDED_AT.plusDays(GRACE_DAYS);

    @Test
    @DisplayName("ACTIVE·PENDING·CLOSED 는 종료 불가")
    void wrongStatusDenied() {
        assertThat(evaluate(TenantStatus.ACTIVE, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.STATUS_NOT_ALLOWED);
        assertThat(evaluate(TenantStatus.PENDING, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.STATUS_NOT_ALLOWED);
        assertThat(evaluate(TenantStatus.CLOSED, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.STATUS_NOT_ALLOWED);
        assertThat(evaluate(null, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.STATUS_NOT_ALLOWED);
    }

    @Test
    @DisplayName("정지 시각이 없으면 유예 미경과")
    void missingSuspendedAtDenied() {
        assertThat(evaluate(TenantStatus.SUSPENDED, null, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.GRACE_NOT_ELAPSED);
    }

    @Test
    @DisplayName("유예 직전과 당일은 거절, 경과 시각부터 허용")
    void graceBoundary() {
        LocalDateTime oneNanosBefore = GRACE_ELAPSED.minusNanos(1);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, oneNanosBefore, false))
                .isEqualTo(TenantCloseDecision.GRACE_NOT_ELAPSED);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, GRACE_ELAPSED.minusDays(1), false))
                .isEqualTo(TenantCloseDecision.GRACE_NOT_ELAPSED);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.ALLOWED);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, GRACE_ELAPSED.plusDays(1), false))
                .isEqualTo(TenantCloseDecision.ALLOWED);
    }

    @Test
    @DisplayName("KST 자정 경계 — 1월 1일 0시 정지, 30일 유예는 1월 31일 0시부터")
    void kstMidnightBoundary() {
        LocalDateTime lastMomentOfGrace = LocalDateTime.of(2026, 1, 30, 23, 59, 59, 999_999_999);
        LocalDateTime firstAllowed = LocalDateTime.of(2026, 1, 31, 0, 0);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, lastMomentOfGrace, false))
                .isEqualTo(TenantCloseDecision.GRACE_NOT_ELAPSED);
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, firstAllowed, false))
                .isEqualTo(TenantCloseDecision.ALLOWED);
    }

    @Test
    @DisplayName("유예가 지나도 유효 구독이 있으면 거절")
    void effectiveSubscriptionDenied() {
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, GRACE_ELAPSED, true))
                .isEqualTo(TenantCloseDecision.ACTIVE_SUBSCRIPTION);
    }

    @Test
    @DisplayName("유예가 지나고 유효 구독이 없으면 허용")
    void allowedWithoutSubscription() {
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, GRACE_ELAPSED, false))
                .isEqualTo(TenantCloseDecision.ALLOWED);
    }

    @Test
    @DisplayName("유예 안이면 구독이 없어도 거절")
    void insideGraceWithoutSubscriptionDenied() {
        assertThat(evaluate(TenantStatus.SUSPENDED, SUSPENDED_AT, SUSPENDED_AT.plusDays(GRACE_DAYS - 1), false))
                .isEqualTo(TenantCloseDecision.GRACE_NOT_ELAPSED);
    }

    private static TenantCloseDecision evaluate(
            TenantStatus status,
            LocalDateTime suspendedAt,
            LocalDateTime now,
            boolean hasEffectiveSubscription) {
        return TenantCloseRules.evaluate(status, suspendedAt, now, GRACE_DAYS, hasEffectiveSubscription);
    }
}
