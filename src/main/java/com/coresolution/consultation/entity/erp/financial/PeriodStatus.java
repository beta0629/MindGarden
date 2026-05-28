package com.coresolution.consultation.entity.erp.financial;

/**
 * 재무 마감 기간 상태.
 *
 * <p>합의서 §2 Q3 / Q6:
 * <ul>
 *   <li>{@link #OPEN}: 아직 마감 전. 라이브 합산 사용.</li>
 *   <li>{@link #CLOSED}: 마감 완료. 거래 수정·삭제 차단, KPI 스냅샷 사용.</li>
 *   <li>{@link #REOPENED}: HQ_ADMIN 재오픈 후 수정 가능. 재마감 시 동일 row UPDATE.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public enum PeriodStatus {

    OPEN,

    CLOSED,

    REOPENED;

    /**
     * 닫힌 상태(CLOSED 또는 REOPENED) 여부.
     *
     * <p>{@link com.coresolution.consultation.service.erp.FinancialPeriodService#isPeriodClosed} 가
     * 마감 후 거래 수정 가드 판단에 사용. REOPENED 상태에서는 HQ_ADMIN 만 추가 수정 가능하므로
     * 일반 ADMIN 가드는 본 메서드 결과로 차단된다.</p>
     *
     * @return 닫힌 상태이면 true
     */
    public boolean isClosedOrReopened() {
        return this == CLOSED || this == REOPENED;
    }
}
