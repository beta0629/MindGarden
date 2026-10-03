package com.coresolution.core.service.impl;

import java.sql.SQLException;
import java.util.Map;

/**
 * 온보딩 결정 HTTP 한 건이 프록시 읽기 제한 안에 끝나도록 남은 시간을 계산한다.
 * 승인 프로시저는 이 예산 안에서 기존 decide 트랜잭션으로 실행하고, 예산이 없으면 추가 재시도를 시작하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public final class OnboardingDecisionDeadline {

    /**
     * ops.dev nginx {@code location ^~ /api/} {@code proxy_read_timeout}.
     * 결정 응답은 이 시간 안에 커밋되어 나가야 한다.
     */
    public static final int PROXY_READ_TIMEOUT_SECONDS = 120;

    /**
     * Spring 트랜잭션 제한. 프록시가 연결을 끊기 전에 커밋 또는 실패 응답이 나가도록 둔다.
     */
    public static final int TRANSACTION_TIMEOUT_SECONDS = 105;

    /**
     * {@code ProcessOnboardingApproval} statement 제한.
     * 한 번 호출이 프록시 창을 넘지 않게 하고, 성공 시 관리자 계정 정합성 보강에 시간을 남긴다.
     */
    public static final int PROCEDURE_STATEMENT_TIMEOUT_SECONDS = 80;

    /** 결정 경로의 프로시저 시도 횟수. 시도마다 statement 제한을 다시 쓰면 120초를 넘긴다. */
    public static final int DECISION_MAX_ATTEMPTS = 1;

    /** 추가 시도가 없으므로 재시도 대기도 없다. */
    public static final long DECISION_RETRY_DELAY_MS = 0L;

    /** 이 초보다 적게 남으면 Java fallback 을 시작하지 않는다. */
    public static final int MIN_FALLBACK_SECONDS = 5;

    static final String RESULT_HALT = "decisionBudgetExhausted";

    private static final ThreadLocal<Long> DEADLINE_EPOCH_MS = new ThreadLocal<>();

    private OnboardingDecisionDeadline() {
    }

    /**
     * 결정 트랜잭션과 같은 길이의 마감을 현재 스레드에 연다.
     */
    public static void open() {
        DEADLINE_EPOCH_MS.set(System.currentTimeMillis() + TRANSACTION_TIMEOUT_SECONDS * 1000L);
    }

    /**
     * 요청 스레드에 마감이 남지 않도록 닫는다.
     */
    public static void close() {
        DEADLINE_EPOCH_MS.remove();
    }

    /**
     * 테스트에서 마감 시각을 직접 넣는다.
     *
     * @param deadlineEpochMs 마감 epoch millis
     */
    static void bindDeadlineEpochMillis(long deadlineEpochMs) {
        DEADLINE_EPOCH_MS.set(deadlineEpochMs);
    }

    /**
     * @return 마감까지 남은 초. 마감이 없으면 statement 상한
     */
    public static int remainingSeconds() {
        Long deadlineEpochMs = DEADLINE_EPOCH_MS.get();
        if (deadlineEpochMs == null) {
            return PROCEDURE_STATEMENT_TIMEOUT_SECONDS;
        }
        long remainingMs = deadlineEpochMs - System.currentTimeMillis();
        if (remainingMs <= 0L) {
            return 0;
        }
        long remainingSeconds = (remainingMs + 999L) / 1000L;
        return (int) Math.min(PROCEDURE_STATEMENT_TIMEOUT_SECONDS, remainingSeconds);
    }

    /**
     * @return JDBC statement 타임아웃(초). 1 이상이며 프록시 창보다 짧다
     */
    public static int statementTimeoutSeconds() {
        int remainingSeconds = remainingSeconds();
        if (remainingSeconds <= 0) {
            return 1;
        }
        return Math.min(remainingSeconds, PROCEDURE_STATEMENT_TIMEOUT_SECONDS);
    }

    /**
     * @return Java fallback 을 시작해도 응답 예산 안에 들어갈 수 있는지
     */
    public static boolean fallbackAllowed() {
        Long deadlineEpochMs = DEADLINE_EPOCH_MS.get();
        if (deadlineEpochMs == null) {
            return true;
        }
        long remainingMs = deadlineEpochMs - System.currentTimeMillis();
        return remainingMs >= MIN_FALLBACK_SECONDS * 1000L;
    }

    /**
     * @param result 프로시저 결과
     */
    public static void markHalted(Map<String, Object> result) {
        if (result != null) {
            result.put(RESULT_HALT, Boolean.TRUE);
        }
    }

    /**
     * @param result 프로시저 결과
     * @return statement 타임아웃으로 이후 단계를 중단해야 하면 true
     */
    public static boolean isHalted(Map<String, Object> result) {
        return result != null && Boolean.TRUE.equals(result.get(RESULT_HALT));
    }

    /**
     * @param exception SQL 예외
     * @return JDBC statement 타임아웃 또는 MySQL 쿼리 중단이면 true
     */
    public static boolean isStatementTimeout(SQLException exception) {
        Throwable current = exception;
        int depth = 0;
        while (current != null && depth < 10) {
            String className = current.getClass().getName();
            if (className.contains("MySQLTimeoutException")
                    || className.contains("MySQLQueryInterruptedException")) {
                return true;
            }
            if (current instanceof SQLException sqlException
                    && sqlException.getErrorCode() == 1317) {
                return true;
            }
            String message = current.getMessage();
            if (message != null) {
                String lowerMessage = message.toLowerCase();
                if (lowerMessage.contains("statement cancelled due to timeout")
                        || lowerMessage.contains("query execution was interrupted")
                        || lowerMessage.contains("max_execution_time")) {
                    return true;
                }
            }
            current = current.getCause();
            depth++;
        }
        return false;
    }

    /**
     * @param throwable 예외
     * @return 원인 체인에 statement 타임아웃이 있으면 true
     */
    public static boolean isStatementTimeoutCause(Throwable throwable) {
        Throwable current = throwable;
        int depth = 0;
        while (current != null && depth < 10) {
            if (current instanceof SQLException sqlException && isStatementTimeout(sqlException)) {
                return true;
            }
            current = current.getCause();
            depth++;
        }
        return false;
    }
}
