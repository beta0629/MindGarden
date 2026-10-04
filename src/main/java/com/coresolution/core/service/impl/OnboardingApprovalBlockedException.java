package com.coresolution.core.service.impl;

import com.coresolution.core.constant.OnboardingConstants;

/**
 * 승인을 확정할 수 없을 때 던진다.
 * 승인 트랜잭션은 롤백되고 요청은 승인으로 남지 않는다. 응답에는 차단 사유를 그대로 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public class OnboardingApprovalBlockedException extends RuntimeException {

    /** 응답 errorCode. */
    public static final String ERROR_CODE = "ONBOARDING_APPROVAL_BLOCKED";

    /**
     * @param reason 운영자에게 보여줄 차단 사유
     */
    public OnboardingApprovalBlockedException(String reason) {
        super(reason == null || reason.isBlank()
                ? OnboardingConstants.ERROR_ONBOARDING_APPROVAL_UNKNOWN
                : reason);
    }
}
