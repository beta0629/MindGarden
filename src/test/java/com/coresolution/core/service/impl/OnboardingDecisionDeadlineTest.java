package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.SQLException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 온보딩 결정 응답 예산이 프록시 읽기 제한보다 짧은지 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
class OnboardingDecisionDeadlineTest {

    @AfterEach
    void tearDown() {
        OnboardingDecisionDeadline.close();
    }

    @Test
    @DisplayName("결정 트랜잭션과 프로시저 statement 제한은 프록시 120초보다 짧고 재시도로 곱해지지 않는다")
    void budgetStaysInsideProxyWindow() {
        assertThat(OnboardingDecisionDeadline.TRANSACTION_TIMEOUT_SECONDS)
                .isLessThan(OnboardingDecisionDeadline.PROXY_READ_TIMEOUT_SECONDS);
        assertThat(OnboardingDecisionDeadline.PROCEDURE_STATEMENT_TIMEOUT_SECONDS)
                .isLessThan(OnboardingDecisionDeadline.TRANSACTION_TIMEOUT_SECONDS);
        assertThat(OnboardingDecisionDeadline.DECISION_MAX_ATTEMPTS).isEqualTo(1);
        assertThat(OnboardingDecisionDeadline.PROCEDURE_STATEMENT_TIMEOUT_SECONDS
                * OnboardingDecisionDeadline.DECISION_MAX_ATTEMPTS)
                        .isLessThan(OnboardingDecisionDeadline.PROXY_READ_TIMEOUT_SECONDS);
        assertThat(OnboardingDecisionDeadline.DECISION_RETRY_DELAY_MS).isZero();
    }

    @Test
    @DisplayName("마감이 열리면 statement 타임아웃은 프록시 창보다 짧다")
    void openDeadlineCapsStatementTimeout() {
        OnboardingDecisionDeadline.open();

        assertThat(OnboardingDecisionDeadline.statementTimeoutSeconds())
                .isBetween(1, OnboardingDecisionDeadline.PROCEDURE_STATEMENT_TIMEOUT_SECONDS);
        assertThat(OnboardingDecisionDeadline.statementTimeoutSeconds())
                .isLessThan(OnboardingDecisionDeadline.PROXY_READ_TIMEOUT_SECONDS);
        assertThat(OnboardingDecisionDeadline.fallbackAllowed()).isTrue();
    }

    @Test
    @DisplayName("마감이 지나면 fallback 을 시작하지 않는다")
    void expiredDeadlineBlocksFallback() {
        OnboardingDecisionDeadline.bindDeadlineEpochMillis(System.currentTimeMillis() - 1_000L);

        assertThat(OnboardingDecisionDeadline.remainingSeconds()).isZero();
        assertThat(OnboardingDecisionDeadline.fallbackAllowed()).isFalse();
        assertThat(OnboardingDecisionDeadline.statementTimeoutSeconds()).isEqualTo(1);
    }

    @Test
    @DisplayName("statement 타임아웃 SQLException 은 이후 단계를 중단하는 실패로 본다")
    void statementTimeoutIsRecognized() {
        SQLException timeout = new SQLException(
                "Statement cancelled due to timeout or client request", "HY000", 0);
        SQLException interrupted = new SQLException("Query execution was interrupted", "70100", 1317);

        assertThat(OnboardingDecisionDeadline.isStatementTimeout(timeout)).isTrue();
        assertThat(OnboardingDecisionDeadline.isStatementTimeout(interrupted)).isTrue();
        assertThat(OnboardingDecisionDeadline.isStatementTimeout(
                new SQLException("Duplicate entry", "23000", 1062))).isFalse();
    }
}
