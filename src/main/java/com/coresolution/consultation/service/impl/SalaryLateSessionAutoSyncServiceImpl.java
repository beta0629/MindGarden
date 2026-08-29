package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.salary.SalaryLateSessionAutoSyncConstants;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link SalaryLateSessionAutoSyncService} 구현.
 *
 * <p>Fail-soft: 자동 경로 실패는 error 로그만 남기고 호출부(일지/스케줄 저장)에 전파하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryLateSessionAutoSyncServiceImpl implements SalaryLateSessionAutoSyncService {

    private final SalaryCalculationRepository salaryCalculationRepository;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;

    /**
     * {@inheritDoc}
     */
    @Override
    public void syncAfterScheduleCompleted(Schedule schedule) {
        if (schedule == null) {
            return;
        }
        String tenantId = schedule.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        syncAfterScheduleCompleted(tenantId, schedule.getConsultantId(), schedule.getDate());
    }

    /**
     * {@inheritDoc}
     *
     * <p>Fail-soft: 예외를 삼켜 일지/스케줄 저장 트랜잭션을 깨지 않는다.
     * Recalc/Adjustment 는 JDBC SP 자체 트랜잭션을 사용한다.</p>
     */
    @Override
    public void syncAfterScheduleCompleted(String tenantId, Long consultantId, LocalDate scheduleDate) {
        try {
            doSync(tenantId, consultantId, scheduleDate);
        } catch (Exception e) {
            log.error(
                    "급여 늦은 회기 자동 동기화 실패(fail-soft): tenantId={}, consultantId={}, scheduleDate={}, error={}",
                    tenantId, consultantId, scheduleDate, e.getMessage(), e);
        }
    }

    private void doSync(String tenantId, Long consultantId, LocalDate scheduleDate) {
        if (tenantId == null || tenantId.isBlank()) {
            log.debug("급여 늦은 회기 자동 동기화 skip: tenantId 없음");
            return;
        }
        if (consultantId == null || scheduleDate == null) {
            log.debug("급여 늦은 회기 자동 동기화 skip: consultantId/scheduleDate 없음");
            return;
        }

        String calculationPeriod = YearMonth.from(scheduleDate).toString();
        Optional<SalaryCalculation> primaryOpt =
                salaryCalculationRepository
                        .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                                tenantId, consultantId, calculationPeriod, CalculationKind.PRIMARY);

        if (primaryOpt.isEmpty()) {
            log.debug(
                    "급여 늦은 회기 자동 동기화 no-op: PRIMARY 없음 tenantId={}, consultantId={}, period={}",
                    tenantId, consultantId, calculationPeriod);
            return;
        }

        SalaryCalculation primary = primaryOpt.get();
        SalaryStatus status = primary.getStatus();
        Long calculationId = primary.getId();

        if (status == SalaryStatus.CALCULATED || status == SalaryStatus.APPROVED) {
            log.info(
                    "급여 늦은 회기 자동 재계산: calculationId={}, status={}, period={}, consultantId={}",
                    calculationId, status, calculationPeriod, consultantId);
            Map<String, Object> result = plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(
                    calculationId, tenantId, SalaryLateSessionAutoSyncConstants.TRIGGERED_BY);
            log.info(
                    "급여 늦은 회기 자동 재계산 결과: calculationId={}, success={}, message={}",
                    calculationId, result.get("success"), result.get("message"));
            return;
        }

        if (status == SalaryStatus.PAID) {
            log.info(
                    "급여 늦은 회기 자동 추가정산: calculationId={}, period={}, consultantId={}",
                    calculationId, calculationPeriod, consultantId);
            Map<String, Object> result =
                    plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(
                            calculationId, tenantId, SalaryLateSessionAutoSyncConstants.TRIGGERED_BY);
            Boolean success = (Boolean) result.get("success");
            if (Boolean.FALSE.equals(success)) {
                log.info(
                        "급여 늦은 회기 자동 추가정산 no-op/거절: calculationId={}, message={}",
                        calculationId, result.get("message"));
            } else {
                log.info(
                        "급여 늦은 회기 자동 추가정산 결과: primaryId={}, newId={}, success={}, message={}",
                        calculationId, result.get("calculationId"), success, result.get("message"));
            }
            return;
        }

        log.debug(
                "급여 늦은 회기 자동 동기화 skip: 대상 상태 아님 calculationId={}, status={}",
                calculationId, status);
    }
}
