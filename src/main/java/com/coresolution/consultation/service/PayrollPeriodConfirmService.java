package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;

/**
 * 급여 확정. 보정 기간에는 같은 달 PRIMARY 를 다시 계산하고, 기간이 끝나면 거절한다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public interface PayrollPeriodConfirmService {

    /**
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일
     * @param triggeredBy  호출자
     * @return success 와 금액
     */
    Map<String, Object> confirm(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd, String triggeredBy);

    /**
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일
     * @return 비삭제 PRIMARY
     */
    Optional<SalaryCalculation> findPrimary(
            String tenantId, Long consultantId, LocalDate periodStart, LocalDate periodEnd);
}
