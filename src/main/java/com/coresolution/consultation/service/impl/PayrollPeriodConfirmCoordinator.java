package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.salary.PayrollConfirmDecision;
import com.coresolution.consultation.service.PayrollPeriodConfirmService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 확정 한 곳. 보정 기간에는 기존 PRIMARY 를 재계산하고, 기간이 끝나면 거절한다.
 * 최초 1건만 {@code ProcessIntegratedSalaryCalculation} 으로 저장한다.
 *
 * <p>이 메서드는 PortOne·SMS 같은 외부 HTTP 를 호출하지 않는다.
 * 금액은 JDBC 저장 프로시저({@code RecalcUnpaidSalaryCalculation},
 * {@code ProcessIntegratedSalaryCalculation})가 계산한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollPeriodConfirmCoordinator implements PayrollPeriodConfirmService {

    private final PayrollPeriodConfirmGate payrollPeriodConfirmGate;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;

    /**
     * 상담사·기간 급여를 확정하거나, 보정 기간이면 같은 행을 고친다.
     *
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일
     * @param triggeredBy  호출자
     * @return success, calculationId, grossSalary, netSalary, taxAmount
     */
    @Override
    public Map<String, Object> confirm(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd, String triggeredBy) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        PayrollConfirmDecision decision = payrollPeriodConfirmGate.evaluate(
                tenantId, consultantId, periodStart, periodEnd);
        if (decision.kind() == PayrollConfirmDecision.Kind.REPLACE) {
            log.info("급여 확정 보정 재계산: calculationId={} consultantId={}",
                    decision.calculationId(), consultantId);
            return plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(
                    decision.calculationId(), tenantId, triggeredBy);
        }
        if (decision.kind() == PayrollConfirmDecision.Kind.REJECT) {
            return decision.rejection();
        }
        return plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                consultantId, periodStart, periodEnd, triggeredBy);
    }

    /**
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일
     * @return 비삭제 PRIMARY
     */
    @Override
    public Optional<SalaryCalculation> findPrimary(
            String tenantId, Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        return payrollPeriodConfirmGate.findPrimary(tenantId, consultantId, periodStart, periodEnd);
    }
}
