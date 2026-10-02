package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.salary.PayrollConfirmDecision;
import com.coresolution.consultation.salary.PayrollConfirmGrace;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 같은 상담사·같은 달 PRIMARY 가 있을 때 확정을 거절할지, 제자리 재계산할지 정한다.
 * 금액 공식은 저장 프로시저에 두고, 이 클래스는 잠금 시각만 본다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
@Slf4j
@Component
public class PayrollPeriodConfirmGate {

    private final SalaryCalculationRepository salaryCalculationRepository;
    private Clock clock = Clock.system(PayrollConfirmGrace.ZONE);

    /**
     * @param salaryCalculationRepository 테넌트·상담사·급여 월 PRIMARY 조회
     */
    public PayrollPeriodConfirmGate(SalaryCalculationRepository salaryCalculationRepository) {
        this.salaryCalculationRepository = salaryCalculationRepository;
    }

    /**
     * 테스트에서 KST 경계를 고정할 때 쓴다.
     *
     * @param clock 판단 시각
     */
    public void useClock(Clock clock) {
        this.clock = clock;
    }

    /**
     * 비삭제 PRIMARY 1건. 기간 끝 달과 기간 시작 달 키가 다르면 둘 다 본다.
     *
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일 (기산일)
     * @return PRIMARY 또는 empty
     */
    public Optional<SalaryCalculation> findPrimary(
            String tenantId, Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        if (tenantId == null || tenantId.isBlank() || consultantId == null || periodEnd == null) {
            return Optional.empty();
        }
        String endKey = YearMonth.from(periodEnd).toString();
        Optional<SalaryCalculation> byEnd = salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        tenantId, consultantId, endKey, CalculationKind.PRIMARY);
        if (byEnd.isPresent() || periodStart == null) {
            return byEnd;
        }
        String startKey = YearMonth.from(periodStart).toString();
        if (startKey.equals(endKey)) {
            return byEnd;
        }
        return salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        tenantId, consultantId, startKey, CalculationKind.PRIMARY);
    }

    /**
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @param periodStart  계산 시작일
     * @param periodEnd    계산 종료일
     * @return PROCEED / REPLACE / REJECT
     */
    public PayrollConfirmDecision evaluate(
            String tenantId, Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        Optional<SalaryCalculation> existing = findPrimary(tenantId, consultantId, periodStart, periodEnd);
        if (existing.isEmpty()) {
            return PayrollConfirmDecision.proceed();
        }
        SalaryCalculation row = existing.get();
        YearMonth payrollMonth = PayrollConfirmGrace.payrollMonth(periodEnd);
        boolean open = PayrollConfirmGrace.isCorrectionOpen(payrollMonth, clock.instant());
        if (row.getStatus() == SalaryStatus.PAID) {
            log.info("급여 확정 거절: 지급 완료 calculationId={} period={}", row.getId(), payrollMonth);
            return PayrollConfirmDecision.reject(unchanged(row, PayrollConfirmGrace.PAID_NOT_REPLACEABLE));
        }
        if (open && isReplaceable(row.getStatus())) {
            log.info("급여 확정 보정: calculationId={} period={} status={}",
                    row.getId(), payrollMonth, row.getStatus());
            return PayrollConfirmDecision.replace(row.getId());
        }
        log.info("급여 확정 거절: 보정 기간 종료 calculationId={} period={}", row.getId(), payrollMonth);
        return PayrollConfirmDecision.reject(
                unchanged(row, PayrollConfirmGrace.ALREADY_CONFIRMED_AFTER_GRACE));
    }

    private static boolean isReplaceable(SalaryStatus status) {
        return status == SalaryStatus.CALCULATED
                || status == SalaryStatus.APPROVED
                || status == SalaryStatus.PENDING;
    }

    /**
     * 기존 행의 금액을 그대로 돌려준다. 새 금액을 더하지 않는다.
     *
     * @param row     저장된 PRIMARY
     * @param message 거절 문구
     * @return success=false 맵
     */
    private static Map<String, Object> unchanged(SalaryCalculation row, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", Boolean.FALSE);
        body.put("message", message);
        body.put("calculationId", row.getId());
        body.put("completedConsultations", row.getCompletedConsultations());
        body.put("grossSalary", row.getGrossSalary());
        body.put("netSalary", row.getNetSalary());
        body.put("taxAmount", row.getDeductions());
        return body;
    }
}
