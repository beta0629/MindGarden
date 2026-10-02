package com.coresolution.consultation.salary;

import java.util.Collections;
import java.util.Map;

/**
 * 같은 상담사·같은 달 PRIMARY 가 있을 때 확정이 취할 동작.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PayrollConfirmDecision {

    /**
     * 확정 분기.
     */
    public enum Kind {
        /** PRIMARY 없음. 최초 저장 프로시저로 1건을 만든다. */
        PROCEED,
        /** 보정 기간. 같은 행을 재계산해 금액을 바꾼다. 두 번째 행은 만들지 않는다. */
        REPLACE,
        /** 보정 기간이 끝났거나 지급 완료. 저장·가산을 하지 않는다. */
        REJECT
    }

    private final Kind kind;
    private final Long calculationId;
    private final Map<String, Object> rejection;

    private PayrollConfirmDecision(Kind kind, Long calculationId, Map<String, Object> rejection) {
        this.kind = kind;
        this.calculationId = calculationId;
        this.rejection = rejection == null ? Map.of() : rejection;
    }

    /**
     * @return 최초 확정
     */
    public static PayrollConfirmDecision proceed() {
        return new PayrollConfirmDecision(Kind.PROCEED, null, Map.of());
    }

    /**
     * @param calculationId 재계산할 PRIMARY id
     * @return 제자리 재계산
     */
    public static PayrollConfirmDecision replace(Long calculationId) {
        return new PayrollConfirmDecision(Kind.REPLACE, calculationId, Map.of());
    }

    /**
     * @param rejection success=false 와 기존 금액. 가산하지 않은 값이다.
     * @return 거절
     */
    public static PayrollConfirmDecision reject(Map<String, Object> rejection) {
        return new PayrollConfirmDecision(Kind.REJECT, null, rejection);
    }

    /**
     * @return 분기
     */
    public Kind kind() {
        return kind;
    }

    /**
     * @return REPLACE 일 때의 급여 계산 id
     */
    public Long calculationId() {
        return calculationId;
    }

    /**
     * @return REJECT 일 때 호출자에게 돌려줄 맵. 그 외에는 빈 맵.
     */
    public Map<String, Object> rejection() {
        return Collections.unmodifiableMap(rejection);
    }
}
