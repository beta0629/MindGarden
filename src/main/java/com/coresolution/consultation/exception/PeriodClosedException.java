package com.coresolution.consultation.exception;

import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 마감된 기간(CLOSED 또는 REOPENED 상태)의 거래 수정·삭제 시도를 차단하는 예외.
 *
 * <p>합의서 §2 Q3: 강제 차단 + HQ_ADMIN 만 재오픈 후 수정 가능.
 * {@link com.coresolution.consultation.service.impl.FinancialTransactionServiceImpl#updateTransaction}
 * / {@code deleteTransaction} 진입부에서 throw 한다.</p>
 *
 * <p>HTTP 응답: {@code 409 Conflict} + 재오픈 안내 메시지.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class PeriodClosedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final LocalDate periodStart;
    private final LocalDate periodEnd;

    /**
     * 마감 기간 정보를 포함한 예외 생성.
     *
     * @param periodStart 마감 기간 시작일
     * @param periodEnd 마감 기간 종료일
     */
    public PeriodClosedException(LocalDate periodStart, LocalDate periodEnd) {
        super(String.format(
                "마감된 기간(%s ~ %s)의 거래는 수정할 수 없습니다. HQ_ADMIN 에게 재오픈을 요청하세요.",
                periodStart, periodEnd));
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }
}
