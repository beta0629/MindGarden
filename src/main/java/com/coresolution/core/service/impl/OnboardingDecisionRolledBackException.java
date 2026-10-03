package com.coresolution.core.service.impl;

import com.coresolution.core.constant.OnboardingConstants;

/**
 * 결정 트랜잭션이 rollback-only 인 채로 커밋되면 안 될 때 던진다.
 * 호출부는 롤백이 끝난 뒤 기존 보류 상태로 다시 저장한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public class OnboardingDecisionRolledBackException extends RuntimeException {

    private final String holdNote;

    /**
     * @param holdNote 롤백 후 보류 메모. 응답 본문으로 쓰지 않는다.
     */
    public OnboardingDecisionRolledBackException(String holdNote) {
        super(OnboardingConstants.MSG_DECISION_HELD_AFTER_FAILURE);
        this.holdNote = holdNote;
    }

    /**
     * @return 보류 메모
     */
    public String getHoldNote() {
        return holdNote;
    }
}
