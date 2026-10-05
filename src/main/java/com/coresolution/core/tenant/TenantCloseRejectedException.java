package com.coresolution.core.tenant;

/**
 * 종료를 거절할 때 던진다. 응답에는 코드와 상수 문구만 나간다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public class TenantCloseRejectedException extends RuntimeException {

    private final String errorCode;

    /**
     * @param decision 종료 판정 (ALLOWED 가 아닌 값)
     */
    public TenantCloseRejectedException(TenantCloseDecision decision) {
        super(TenantCloseMessages.messageOf(decision));
        this.errorCode = TenantCloseMessages.codeOf(decision);
    }

    /**
     * @param errorCode 응답 코드
     * @param message   상수 문구
     */
    public TenantCloseRejectedException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    /**
     * @return 응답 errorCode
     */
    public String getErrorCode() {
        return errorCode;
    }
}
