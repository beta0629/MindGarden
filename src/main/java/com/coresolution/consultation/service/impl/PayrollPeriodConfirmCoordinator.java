package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
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
    private final SalaryCalculationRepository salaryCalculationRepository;

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
            Map<String, Object> recalculated = plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(
                    decision.calculationId(), tenantId, triggeredBy);
            if (Boolean.TRUE.equals(recalculated.get("success"))) {
                storeRecalculatedPrimary(
                        tenantId, consultantId, periodStart, periodEnd,
                        decision.calculationId(), recalculated);
            }
            return recalculated;
        }
        if (decision.kind() == PayrollConfirmDecision.Kind.REJECT) {
            return decision.rejection();
        }
        return plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                consultantId, periodStart, periodEnd, triggeredBy);
    }

    /**
     * 재계산 결과(회기·총급여·세액·실지급)를 같은 PRIMARY 에 남긴다.
     * 프로시저 OUT 값을 행에 복사한 뒤, 그 컬럼만 갱신한다.
     *
     * @param tenantId      테넌트 ID
     * @param consultantId  상담사 ID
     * @param periodStart   계산 시작일
     * @param periodEnd     계산 종료일
     * @param calculationId 재계산한 PRIMARY id
     * @param recalculated  RecalcUnpaidSalaryCalculation 결과
     */
    private void storeRecalculatedPrimary(
            String tenantId,
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            Long calculationId,
            Map<String, Object> recalculated) {
        Integer completed = asInteger(recalculated.get("completedConsultations"));
        BigDecimal gross = asMoney(recalculated.get("grossSalary"));
        BigDecimal net = asMoney(recalculated.get("netSalary"));
        BigDecimal tax = asMoney(recalculated.get("taxAmount"));
        Long returnedId = asLong(recalculated.get("calculationId"));
        if (completed == null || gross == null || net == null || tax == null || calculationId == null) {
            log.warn("급여 재계산 결과를 행에 남기지 않음: calculationId={}", calculationId);
            return;
        }
        if (returnedId != null && !calculationId.equals(returnedId)) {
            log.warn("급여 재계산 id 불일치: expected={} returned={}", calculationId, returnedId);
            return;
        }
        Optional<SalaryCalculation> stored = payrollPeriodConfirmGate.findPrimary(
                tenantId, consultantId, periodStart, periodEnd);
        if (stored.isEmpty() || !calculationId.equals(stored.get().getId())) {
            log.warn("급여 재계산 대상 PRIMARY 없음: calculationId={}", calculationId);
            return;
        }
        SalaryCalculation row = stored.get();
        row.setCompletedConsultations(completed);
        row.setGrossSalary(gross);
        row.setNetSalary(net);
        row.setDeductions(tax);
        row.setTotalSalary(gross);
        int updated = salaryCalculationRepository.updateRecalculatedPrimary(
                calculationId, tenantId, CalculationKind.PRIMARY, completed, gross, net, tax);
        log.info("급여 확정 보정 반영: calculationId={} completed={} netSalary={} updatedRows={}",
                calculationId, completed, net, updated);
    }

    private static Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static BigDecimal asMoney(Object value) {
        if (value instanceof BigDecimal money) {
            return money;
        }
        if (value instanceof Number number) {
            return new BigDecimal(number.toString());
        }
        return null;
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
