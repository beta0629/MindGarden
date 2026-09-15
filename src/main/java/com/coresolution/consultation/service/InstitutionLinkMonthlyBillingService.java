package com.coresolution.consultation.service;

import java.time.YearMonth;
import com.coresolution.consultation.dto.InstitutionLinkMonthlyBillingRunResponse;

/**
 * 타기관 연계 ACTIVE 계약 월청구. remainingSessions·회기권 ERP·가예약 경로를 쓰지 않는다.
 *
 * <p>SSOT: {@code docs/project-management/INSTITUTION_LINK_FINANCE.md}</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public interface InstitutionLinkMonthlyBillingService {

    /**
     * 테넌트 ACTIVE 계약에 대해 지정 연월 RECEIVABLES(타기관월청구)를 멱등으로 생성한다.
     * {@code monthly_amount <= 0} 이면 스킵한다.
     *
     * @param tenantId 테넌트 ID
     * @param yearMonth 청구 연월 ({@code null} 이면 서울 기준 당월)
     * @return 실행 집계
     * @throws IllegalStateException tenantId 가 없거나 공백인 경우
     */
    InstitutionLinkMonthlyBillingRunResponse runMonthlyBilling(String tenantId, YearMonth yearMonth);
}
