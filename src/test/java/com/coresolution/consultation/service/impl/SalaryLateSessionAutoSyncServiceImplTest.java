package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.salary.SalaryLateSessionAutoSyncConstants;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link SalaryLateSessionAutoSyncServiceImpl} 단위 테스트.
 *
 * <p>COMPLETED 전이 시 PRIMARY 상태에 따른 recalc/adjustment 호출·멱등·no-op 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryLateSessionAutoSyncServiceImpl")
class SalaryLateSessionAutoSyncServiceImplTest {

    private static final String TENANT = "tenant-late-auto";
    private static final Long CONSULTANT_ID = 77L;
    private static final LocalDate SCHEDULE_DATE = LocalDate.of(2026, 8, 15);
    private static final String PERIOD = "2026-08";
    private static final Long PRIMARY_ID = 501L;

    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;

    @Mock
    private PlSqlSalaryManagementService plSqlSalaryManagementService;

    @InjectMocks
    private SalaryLateSessionAutoSyncServiceImpl service;

    @Test
    @DisplayName("COMPLETED + PRIMARY CALCULATED → recalc 1회 (90000 경로 공유)")
    void whenCalculated_callsRecalcOnce() {
        SalaryCalculation primary = primary(SalaryStatus.CALCULATED);
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.of(primary));

        Map<String, Object> recalcResult = successRecalcResult();
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(
                eq(PRIMARY_ID), eq(TENANT), eq(SalaryLateSessionAutoSyncConstants.TRIGGERED_BY)))
                .thenReturn(recalcResult);

        Schedule schedule = schedule();
        service.syncAfterScheduleCompleted(schedule);

        verify(plSqlSalaryManagementService, times(1))
                .recalcUnpaidSalaryCalculation(
                        PRIMARY_ID, TENANT, SalaryLateSessionAutoSyncConstants.TRIGGERED_BY);
        verify(plSqlSalaryManagementService, never())
                .insertSalaryAdjustmentForLateSessions(anyLong(), anyString(), anyString());
        assertThat((BigDecimal) recalcResult.get("grossSalary")).isEqualByComparingTo(new BigDecimal("90000.00"));
        assertThat(recalcResult.get("completedConsultations")).isEqualTo(3);
    }

    @Test
    @DisplayName("COMPLETED + PRIMARY APPROVED → recalc 1회")
    void whenApproved_callsRecalcOnce() {
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.of(primary(SalaryStatus.APPROVED)));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(
                eq(PRIMARY_ID), eq(TENANT), eq(SalaryLateSessionAutoSyncConstants.TRIGGERED_BY)))
                .thenReturn(Map.of("success", true, "message", "ok"));

        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);

        verify(plSqlSalaryManagementService, times(1))
                .recalcUnpaidSalaryCalculation(
                        PRIMARY_ID, TENANT, SalaryLateSessionAutoSyncConstants.TRIGGERED_BY);
        verify(plSqlSalaryManagementService, never())
                .insertSalaryAdjustmentForLateSessions(anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("PAID + delta → adjustment 1회; 두 번째 호출도 SP 1회씩(멱등은 SP refuse)")
    void whenPaid_callsAdjustmentOncePerCompletedWrite_noDoubleOnSecondRefuse() {
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.of(primary(SalaryStatus.PAID)));

        Map<String, Object> first = new HashMap<>();
        first.put("success", true);
        first.put("calculationId", 902L);
        first.put("parentCalculationId", PRIMARY_ID);
        first.put("completedConsultations", 1);
        first.put("grossSalary", new BigDecimal("30000.00"));
        first.put("taxAmount", new BigDecimal("990.00"));

        Map<String, Object> second = new HashMap<>();
        second.put("success", false);
        second.put("message", "추가 완료 회기가 없습니다");

        when(plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(
                eq(PRIMARY_ID), eq(TENANT), eq(SalaryLateSessionAutoSyncConstants.TRIGGERED_BY)))
                .thenReturn(first)
                .thenReturn(second);

        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);
        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);

        verify(plSqlSalaryManagementService, times(2))
                .insertSalaryAdjustmentForLateSessions(
                        PRIMARY_ID, TENANT, SalaryLateSessionAutoSyncConstants.TRIGGERED_BY);
        verify(plSqlSalaryManagementService, never())
                .recalcUnpaidSalaryCalculation(anyLong(), anyString(), anyString());
        assertThat((BigDecimal) first.get("grossSalary")).isEqualByComparingTo(new BigDecimal("30000.00"));
    }

    @Test
    @DisplayName("PRIMARY 없음 → recalc/adjustment 미호출")
    void whenNoPrimary_noCalls() {
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.empty());

        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);

        verify(plSqlSalaryManagementService, never())
                .recalcUnpaidSalaryCalculation(anyLong(), anyString(), anyString());
        verify(plSqlSalaryManagementService, never())
                .insertSalaryAdjustmentForLateSessions(anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("SP 예외 시 fail-soft — 예외 미전파")
    void whenRecalcThrows_failSoftDoesNotPropagate() {
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.of(primary(SalaryStatus.CALCULATED)));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(anyLong(), anyString(), anyString()))
                .thenThrow(new RuntimeException("SP down"));

        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);

        verify(plSqlSalaryManagementService, times(1))
                .recalcUnpaidSalaryCalculation(anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("PENDING 상태 → 미호출")
    void whenPending_noCalls() {
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        TENANT, CONSULTANT_ID, PERIOD, CalculationKind.PRIMARY))
                .thenReturn(Optional.of(primary(SalaryStatus.PENDING)));

        service.syncAfterScheduleCompleted(TENANT, CONSULTANT_ID, SCHEDULE_DATE);

        verify(plSqlSalaryManagementService, never())
                .recalcUnpaidSalaryCalculation(anyLong(), anyString(), anyString());
        verify(plSqlSalaryManagementService, never())
                .insertSalaryAdjustmentForLateSessions(anyLong(), anyString(), anyString());
    }

    private static SalaryCalculation primary(SalaryStatus status) {
        SalaryCalculation sc = new SalaryCalculation();
        sc.setId(PRIMARY_ID);
        sc.setTenantId(TENANT);
        sc.setStatus(status);
        sc.setCalculationKind(CalculationKind.PRIMARY);
        sc.setCalculationPeriod(PERIOD);
        return sc;
    }

    private static Schedule schedule() {
        Schedule s = new Schedule();
        s.setId(1001L);
        s.setTenantId(TENANT);
        s.setConsultantId(CONSULTANT_ID);
        s.setDate(SCHEDULE_DATE);
        return s;
    }

    private static Map<String, Object> successRecalcResult() {
        Map<String, Object> m = new HashMap<>();
        m.put("success", true);
        m.put("calculationId", PRIMARY_ID);
        m.put("completedConsultations", 3);
        m.put("grossSalary", new BigDecimal("90000.00"));
        m.put("netSalary", new BigDecimal("87030.00"));
        m.put("taxAmount", new BigDecimal("2970.00"));
        return m;
    }
}
