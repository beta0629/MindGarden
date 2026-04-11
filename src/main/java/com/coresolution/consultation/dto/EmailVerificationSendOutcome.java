package com.coresolution.consultation.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 이메일 인증 코드 발송 처리 결과(쿨다운·일일 상한·발송 실패 구분).
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class EmailVerificationSendOutcome {

    /**
     * 발송 결과 구분
     */
    public enum Status {
        /** 발송 성공 */
        SUCCESS,
        /** 쿨다운으로 발송하지 않음 */
        COOLDOWN,
        /** 일일 상한 초과 */
        DAILY_LIMIT,
        /** 메일 발송 실패 등 */
        EMAIL_SEND_FAILED
    }

    private final Status status;

    /**
     * {@link Status#COOLDOWN} 일 때만 의미 있음. 재시도 가능 시점까지 권장 대기 시간(초)
     */
    private final long retryAfterSeconds;

    /**
     * 성공 결과를 반환합니다.
     *
     * @return 성공 결과
     */
    public static EmailVerificationSendOutcome success() {
        return new EmailVerificationSendOutcome(Status.SUCCESS, 0L);
    }

    /**
     * 쿨다운 결과를 반환합니다.
     *
     * @param retryAfterSeconds 재시도까지 권장 대기 시간(초), 최소 1
     * @return 쿨다운 결과
     */
    public static EmailVerificationSendOutcome cooldown(long retryAfterSeconds) {
        long safe = Math.max(1L, retryAfterSeconds);
        return new EmailVerificationSendOutcome(Status.COOLDOWN, safe);
    }

    /**
     * 일일 상한 초과 결과를 반환합니다.
     *
     * @return 일일 상한 결과
     */
    public static EmailVerificationSendOutcome dailyLimit() {
        return new EmailVerificationSendOutcome(Status.DAILY_LIMIT, 0L);
    }

    /**
     * 이메일 발송 실패 결과를 반환합니다.
     *
     * @return 발송 실패 결과
     */
    public static EmailVerificationSendOutcome emailSendFailed() {
        return new EmailVerificationSendOutcome(Status.EMAIL_SEND_FAILED, 0L);
    }
}
