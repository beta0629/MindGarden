package com.coresolution.consultation.exception;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 마감 시 부가세 누적 차이 감지 시 마감을 차단하는 예외.
 *
 * <p>합의서 §2 Q8: {@code tax_amount_sum != 10% × (income_sum − refund_sum)} 이면
 * {@link com.coresolution.consultation.service.impl.FinancialPeriodServiceImpl#closePeriod} 가
 * 본 예외를 throw 하여 마감을 차단한다. 알림 발송은 호출자
 * (스케줄러 또는 어드민 화면) 에서 트리거한다.</p>
 *
 * <p>HTTP 응답: {@code 422 Unprocessable Entity} — 입력 자체는 형식적으로 유효하나
 * 비즈니스 룰(부가세 정합성)을 만족하지 못함.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class TaxIntegrityException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final BigDecimal expected;
    private final BigDecimal actual;
    private final String tenantId;

    /**
     * 부가세 무결성 위반 예외 생성.
     *
     * @param tenantId 테넌트 ID
     * @param expected 예상 부가세 (10% × (INCOME 합 − REFUND 합))
     * @param actual 실제 누적된 tax_amount 합
     */
    public TaxIntegrityException(String tenantId, BigDecimal expected, BigDecimal actual) {
        super(String.format(
                "부가세 누적 차이 감지: 예상 %s != 실제 %s. 마감 차단.",
                expected, actual));
        this.tenantId = tenantId;
        this.expected = expected;
        this.actual = actual;
    }

    public BigDecimal getExpected() {
        return expected;
    }

    public BigDecimal getActual() {
        return actual;
    }

    public String getTenantId() {
        return tenantId;
    }
}
