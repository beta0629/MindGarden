package com.coresolution.consultation.service.erp;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * ERP 재무 마감 서비스 인터페이스
 * 정기 일/주/월 마감 시 확장용. 현재는 스케줄러에서 호출하는 스텁.
 *
 * @author CoreSolution
 * @since 2026-03-04
 */
public interface ErpFinancialCloseService {

    /**
     * 정기 일 마감(재무) — 전일(D-1) 기준 일 단위 재무 마감·잔액 확정
     *
     * @param tenantId 테넌트 ID
     * @param targetDate 마감 대상일(전일)
     */
    void performDailyClose(String tenantId, LocalDate targetDate);

    /**
     * 정기 주 마감(재무) — 전주 종료일 기준 주간 집계
     *
     * @param tenantId 테넌트 ID
     * @param weekEndDate 전주 마지막 일자
     */
    void performWeeklyClose(String tenantId, LocalDate weekEndDate);

    /**
     * 정기 월 마감(재무) — 전월 말일 기준 월간 집계
     *
     * @param tenantId 테넌트 ID
     * @param yearMonth 전월
     */
    void performMonthlyClose(String tenantId, YearMonth yearMonth);
}
