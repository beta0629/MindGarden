package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.salary.PayrollConfirmGrace;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.PayrollPeriodConfirmService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 급여 확정 익월 보정(기본 3일, Asia/Seoul) 반례.
 * 2026-09 는 2026-10-03 23:59:59 KST 까지 고칠 수 있고 2026-10-04 00:00:00 KST 부터 잠긴다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("급여 확정 익월 보정 기간")
class PayrollConfirmGraceWindowTest {

    private static final String TENANT_A = "tenant-grace-a";
    private static final String TENANT_B = "tenant-grace-b";
    private static final LocalDate SEP_START = LocalDate.of(2026, 9, 1);
    private static final LocalDate SEP_END = LocalDate.of(2026, 9, 30);
    private static final LocalDate AUG_START = LocalDate.of(2026, 8, 1);
    private static final LocalDate AUG_END = LocalDate.of(2026, 8, 31);
    private static final BigDecimal EARLY_NET = new BigDecimal("212740");
    private static final BigDecimal PREVIEW_GROSS = new BigDecimal("360000");
    private static final BigDecimal PREVIEW_TAX = new BigDecimal("11880");
    private static final BigDecimal PREVIEW_NET = new BigDecimal("348120");
    private static final long EARLY_ID = 77L;

    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private PlSqlSalaryManagementService plSqlSalaryManagementService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SalaryScheduleService salaryScheduleService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private BranchService branchService;
    @Mock
    private PayrollPeriodConfirmService payrollPeriodConfirmService;

    private final Map<String, SalaryCalculation> rows = new HashMap<>();
    private PayrollPeriodConfirmGate gate;
    private PayrollPeriodConfirmCoordinator coordinator;

    @BeforeEach
    void setUp() {
        gate = new PayrollPeriodConfirmGate(salaryCalculationRepository);
        coordinator = new PayrollPeriodConfirmCoordinator(
                gate, plSqlSalaryManagementService, salaryCalculationRepository);
        lenient().doAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            String tenantId = invocation.getArgument(1);
            Integer completed = invocation.getArgument(3);
            BigDecimal gross = invocation.getArgument(4);
            BigDecimal net = invocation.getArgument(5);
            BigDecimal tax = invocation.getArgument(6);
            rows.values().stream()
                    .filter(row -> id.equals(row.getId()) && tenantId.equals(row.getTenantId()))
                    .findFirst()
                    .ifPresent(row -> applyRecalculated(row, completed, gross, net, tax));
            return 1;
        }).when(salaryCalculationRepository).updateRecalculatedPrimary(
                anyLong(), anyString(), eq(CalculationKind.PRIMARY),
                any(), any(), any(), any());
        lenient().when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        anyString(), anyLong(), anyString(), eq(CalculationKind.PRIMARY)))
                .thenAnswer(invocation -> Optional.ofNullable(rows.get(key(
                        invocation.getArgument(0),
                        invocation.getArgument(1),
                        invocation.getArgument(2)))));
        TenantContextHolder.setTenantId(TENANT_A);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("1. 2026-10-03 23:59:59 KST 에는 9월 확정이 이미 확정으로 거절되지 않고 9회/348120으로 바뀐다")
    void septemberStillReplaceableAtEndOfOctoberThird() {
        rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
        gate.useClock(kst(2026, 10, 3, 23, 59, 59, 999_000_000));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_A), eq("admin")))
                .thenReturn(previewOfNine());

        Map<String, Object> result = coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(result.get("calculationId")).isEqualTo(EARLY_ID);
        assertThat(result.get("completedConsultations")).isEqualTo(9);
        assertThat(new BigDecimal(result.get("grossSalary").toString())).isEqualByComparingTo(PREVIEW_GROSS);
        assertThat(new BigDecimal(result.get("taxAmount").toString())).isEqualByComparingTo(PREVIEW_TAX);
        assertThat(new BigDecimal(result.get("netSalary").toString())).isEqualByComparingTo(PREVIEW_NET);
        assertThat(String.valueOf(result.get("message")))
                .doesNotContain(PayrollConfirmGrace.ALREADY_CONFIRMED_AFTER_GRACE);
        verify(plSqlSalaryManagementService, never()).processIntegratedSalaryCalculation(
                any(), any(), any(), any());
        verify(plSqlSalaryManagementService, never()).insertSalaryAdjustmentForLateSessions(
                any(), any(), any());
    }

    @Test
    @DisplayName("2. 2026-10-04 00:00:00 KST 에는 재확정이 거절되고 금액이 더해지거나 두 번째 행이 생기지 않는다")
    void septemberLocksAtOctoberFourthMidnightWithoutSecondPayment() {
        rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
        gate.useClock(kst(2026, 10, 4, 0, 0, 0, 0));

        Map<String, Object> result = coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(result.get("message")).isEqualTo(PayrollConfirmGrace.ALREADY_CONFIRMED_AFTER_GRACE);
        assertThat(result.get("calculationId")).isEqualTo(EARLY_ID);
        assertThat(result.get("completedConsultations")).isEqualTo(5);
        assertThat(new BigDecimal(result.get("netSalary").toString())).isEqualByComparingTo(EARLY_NET);
        assertThat(new BigDecimal(result.get("netSalary").toString()))
                .isNotEqualByComparingTo(EARLY_NET.add(PREVIEW_NET));
        verify(plSqlSalaryManagementService, never()).processIntegratedSalaryCalculation(
                any(), any(), any(), any());
        verify(plSqlSalaryManagementService, never()).recalcUnpaidSalaryCalculation(any(), any(), any());
        verify(plSqlSalaryManagementService, never()).insertSalaryAdjustmentForLateSessions(
                any(), any(), any());
        assertThat(rows).hasSize(1);
    }

    @Test
    @DisplayName("3. 2026-09-30 배치는 최종 확정을 쓰지 않고, 그 행이 있어도 2026-10-02 확정은 보정된다")
    void monthEndBatchDoesNotFreezeAndOctoberSecondStillCorrects() {
        SalaryBatchServiceImpl batch = newBatch(kst(2026, 9, 30, 23, 0, 0, 0));

        SalaryBatchService.BatchResult batchResult = batch.executeMonthlySalaryBatch(2026, 9, null);

        assertThat(batchResult.isSuccess()).isFalse();
        assertThat(batchResult.getMessage()).contains("배치 실행 가능 시간이 아닙니다");
        verify(payrollPeriodConfirmService, never()).confirm(any(), any(), any(), any());
        verify(payrollPeriodConfirmService, never()).findPrimary(any(), any(), any(), any());

        rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
        gate.useClock(kst(2026, 10, 2, 12, 0, 0, 0));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_A), anyString()))
                .thenReturn(previewOfNine());

        Map<String, Object> corrected = coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        assertThat(corrected.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(corrected.get("completedConsultations")).isEqualTo(9);
        assertThat(new BigDecimal(corrected.get("netSalary").toString())).isEqualByComparingTo(PREVIEW_NET);
        verify(plSqlSalaryManagementService, never()).processIntegratedSalaryCalculation(
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("4. 보정 중 5회/212740은 같은 행에 9회/348120으로 남고, 잠금 뒤에도 그 저장값이 유지된다")
    void incompleteFiveSessionsReplacedDuringGraceAndRejectedAfter() {
        rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
        gate.useClock(kst(2026, 10, 2, 15, 0, 0, 0));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_A), eq("admin")))
                .thenAnswer(invocation -> {
                    SalaryCalculation stored = rows.get(key(TENANT_A, 1L, "2026-09"));
                    applyRecalculated(stored, 9, PREVIEW_GROSS, PREVIEW_NET, PREVIEW_TAX);
                    return previewOfNine();
                });

        coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        SalaryCalculation storedDuring = rows.get(key(TENANT_A, 1L, "2026-09"));
        assertThat(storedDuring.getId()).isEqualTo(EARLY_ID);
        assertThat(storedDuring.getCompletedConsultations()).isEqualTo(9);
        assertThat(storedDuring.getGrossSalary()).isEqualByComparingTo(PREVIEW_GROSS);
        assertThat(storedDuring.getDeductions()).isEqualByComparingTo(PREVIEW_TAX);
        assertThat(storedDuring.getNetSalary()).isEqualByComparingTo(PREVIEW_NET);
        assertThat(storedDuring.getNetSalary()).isNotEqualByComparingTo(EARLY_NET);
        assertThat(rows).hasSize(1);

        gate.useClock(kst(2026, 10, 4, 0, 0, 0, 0));
        Map<String, Object> after = coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        SalaryCalculation storedAfterLock = rows.get(key(TENANT_A, 1L, "2026-09"));
        assertThat(storedAfterLock).isSameAs(storedDuring);
        assertThat(storedAfterLock.getId()).isEqualTo(EARLY_ID);
        assertThat(storedAfterLock.getCompletedConsultations()).isEqualTo(9);
        assertThat(storedAfterLock.getGrossSalary()).isEqualByComparingTo(PREVIEW_GROSS);
        assertThat(storedAfterLock.getDeductions()).isEqualByComparingTo(PREVIEW_TAX);
        assertThat(storedAfterLock.getNetSalary()).isEqualByComparingTo(PREVIEW_NET);
        assertThat(storedAfterLock.getCompletedConsultations()).isNotEqualTo(5);
        assertThat(storedAfterLock.getNetSalary()).isNotEqualByComparingTo(EARLY_NET);
        assertThat(after.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(after.get("message")).isEqualTo(PayrollConfirmGrace.ALREADY_CONFIRMED_AFTER_GRACE);
        assertThat(after.get("calculationId")).isEqualTo(storedAfterLock.getId());
        assertThat(after.get("completedConsultations")).isEqualTo(storedAfterLock.getCompletedConsultations());
        assertThat(new BigDecimal(after.get("netSalary").toString()))
                .isEqualByComparingTo(storedAfterLock.getNetSalary());
        assertThat(rows).hasSize(1);
        verify(salaryCalculationRepository, times(1)).updateRecalculatedPrimary(
                eq(EARLY_ID), eq(TENANT_A), eq(CalculationKind.PRIMARY), eq(9),
                eq(PREVIEW_GROSS), eq(PREVIEW_NET), eq(PREVIEW_TAX));
        verify(plSqlSalaryManagementService, times(1)).recalcUnpaidSalaryCalculation(
                eq(EARLY_ID), eq(TENANT_A), eq("admin"));
        verify(plSqlSalaryManagementService, never()).processIntegratedSalaryCalculation(
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("5. 보정 기간에 확정을 두 번 해도 저장은 한 번이고 재계산은 같은 id 를 덮어쓴다")
    void retryDuringGraceDoesNotDoublePay() {
        gate.useClock(kst(2026, 10, 2, 9, 0, 0, 0));
        when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                eq(1L), eq(SEP_START), eq(SEP_END), eq("admin")))
                .thenAnswer(invocation -> {
                    rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
                    Map<String, Object> created = new HashMap<>();
                    created.put("success", Boolean.TRUE);
                    created.put("calculationId", EARLY_ID);
                    created.put("completedConsultations", 5);
                    created.put("netSalary", EARLY_NET);
                    return created;
                });
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_A), eq("admin")))
                .thenReturn(previewOfNine());

        Map<String, Object> first = coordinator.confirm(1L, SEP_START, SEP_END, "admin");
        Map<String, Object> second = coordinator.confirm(1L, SEP_START, SEP_END, "admin");

        assertThat(first.get("calculationId")).isEqualTo(EARLY_ID);
        assertThat(first.get("completedConsultations")).isEqualTo(5);
        assertThat(second.get("calculationId")).isEqualTo(EARLY_ID);
        assertThat(second.get("completedConsultations")).isEqualTo(9);
        assertThat(new BigDecimal(second.get("netSalary").toString())).isEqualByComparingTo(PREVIEW_NET);
        assertThat(new BigDecimal(second.get("netSalary").toString()))
                .isNotEqualByComparingTo(EARLY_NET.add(PREVIEW_NET));
        verify(plSqlSalaryManagementService, times(1)).processIntegratedSalaryCalculation(
                eq(1L), eq(SEP_START), eq(SEP_END), eq("admin"));
        verify(plSqlSalaryManagementService, times(1)).recalcUnpaidSalaryCalculation(
                eq(EARLY_ID), eq(TENANT_A), eq("admin"));
        verify(plSqlSalaryManagementService, never()).insertSalaryAdjustmentForLateSessions(
                any(), any(), any());
        assertThat(rows).hasSize(1);
    }

    @Test
    @DisplayName("6. 다른 상담사·다른 달·다른 테넌트 행은 9월 보정에 쓰이지 않는다")
    void otherConsultantMonthAndTenantStayUntouched() {
        rows.put(key(TENANT_A, 1L, "2026-09"), earlySeptember());
        rows.put(key(TENANT_A, 1L, "2026-08"), augustRow());
        gate.useClock(kst(2026, 10, 2, 12, 0, 0, 0));
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_A), eq("admin")))
                .thenReturn(previewOfNine());
        when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                eq(2L), eq(SEP_START), eq(SEP_END), eq("admin")))
                .thenReturn(Map.of("success", Boolean.TRUE, "calculationId", 88L));
        when(plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                eq(1L), eq(SEP_START), eq(SEP_END), eq("other-tenant")))
                .thenReturn(Map.of("success", Boolean.TRUE, "calculationId", 99L));

        Map<String, Object> september = coordinator.confirm(1L, SEP_START, SEP_END, "admin");
        Map<String, Object> otherConsultant = coordinator.confirm(2L, SEP_START, SEP_END, "admin");
        Map<String, Object> august = coordinator.confirm(1L, AUG_START, AUG_END, "admin");
        TenantContextHolder.setTenantId(TENANT_B);
        Map<String, Object> otherTenant = coordinator.confirm(1L, SEP_START, SEP_END, "other-tenant");

        assertThat(september.get("calculationId")).isEqualTo(EARLY_ID);
        assertThat(september.get("completedConsultations")).isEqualTo(9);
        assertThat(otherConsultant.get("calculationId")).isEqualTo(88L);
        assertThat(august.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(august.get("calculationId")).isEqualTo(66L);
        assertThat(august.get("completedConsultations")).isEqualTo(1);
        assertThat(otherTenant.get("calculationId")).isEqualTo(99L);
        verify(plSqlSalaryManagementService, never()).recalcUnpaidSalaryCalculation(eq(66L), any(), any());
        verify(plSqlSalaryManagementService, never()).recalcUnpaidSalaryCalculation(eq(EARLY_ID), eq(TENANT_B), any());
        verify(plSqlSalaryManagementService, times(1)).processIntegratedSalaryCalculation(
                eq(2L), eq(SEP_START), eq(SEP_END), eq("admin"));
        assertThat(rows.get(key(TENANT_A, 1L, "2026-08")).getCompletedConsultations()).isEqualTo(1);
        assertThat(rows).doesNotContainKey(key(TENANT_B, 1L, "2026-09"));
    }

    @Test
    @DisplayName("배치: 10-04 최종 확정은 없는 상담사만 1회 저장하고, 있는 행은 다시 확정하지 않는다")
    void batchOnFourthInsertsOnceAndSkipsExistingRow() {
        User consultant = new User();
        consultant.setId(1L);
        consultant.setName("상담사");
        when(userRepository.findByRoleAndIsActiveTrue(TENANT_A, UserRole.CONSULTANT))
                .thenReturn(List.of(consultant));
        when(salaryScheduleService.getCutoffDate(2026, 9)).thenReturn(SEP_END);
        when(salaryScheduleService.getCalculationPeriod(2026, 9))
                .thenReturn(new LocalDate[] {SEP_START, SEP_END});
        when(payrollPeriodConfirmService.findPrimary(TENANT_A, 1L, SEP_START, SEP_END))
                .thenReturn(Optional.empty(), Optional.of(earlySeptember()));
        when(payrollPeriodConfirmService.confirm(1L, SEP_START, SEP_END, "BATCH_SYSTEM"))
                .thenReturn(Map.of("success", Boolean.TRUE, "calculationId", EARLY_ID, "netSalary", PREVIEW_NET));

        SalaryBatchServiceImpl batch = newBatch(kst(2026, 10, 4, 2, 0, 0, 0));
        SalaryBatchService.BatchResult first = batch.executeMonthlySalaryBatch(2026, 9, null);
        SalaryBatchService.BatchResult second = batch.executeMonthlySalaryBatch(2026, 9, null);

        assertThat(first.isSuccess()).isTrue();
        assertThat(second.isSuccess()).isTrue();
        verify(payrollPeriodConfirmService, times(1)).confirm(1L, SEP_START, SEP_END, "BATCH_SYSTEM");
    }

    @Test
    @DisplayName("10-02 에는 9월 배치가 돌지 않고 10-04 00:00 부터 실행 가능하다")
    void batchWindowOpensOnOctoberFourth() {
        SalaryBatchServiceImpl before = newBatch(kst(2026, 10, 2, 12, 0, 0, 0));
        assertThat(before.canExecuteBatch(SEP_START)).isFalse();

        SalaryBatchServiceImpl atLock = newBatch(kst(2026, 10, 4, 0, 0, 0, 0));
        when(salaryScheduleService.getCutoffDate(2026, 9)).thenReturn(SEP_END);
        assertThat(atLock.canExecuteBatch(SEP_START)).isTrue();
    }

    private SalaryBatchServiceImpl newBatch(Clock clock) {
        SalaryBatchServiceImpl batch = new SalaryBatchServiceImpl(
                userRepository,
                salaryCalculationRepository,
                salaryScheduleService,
                commonCodeService,
                branchService,
                payrollPeriodConfirmService);
        batch.useClock(clock);
        return batch;
    }

    private static Clock kst(int year, int month, int day, int hour, int minute, int second, int nano) {
        return Clock.fixed(
                ZonedDateTime.of(year, month, day, hour, minute, second, nano, PayrollConfirmGrace.ZONE)
                        .toInstant(),
                ZoneId.of("Asia/Seoul"));
    }

    private static String key(String tenantId, long consultantId, String period) {
        return tenantId + ":" + consultantId + ":" + period;
    }

    private static SalaryCalculation earlySeptember() {
        return calculation(EARLY_ID, 1L, "2026-09", SEP_START, SEP_END, SalaryStatus.CALCULATED, 5, EARLY_NET);
    }

    private static SalaryCalculation augustRow() {
        return calculation(66L, 1L, "2026-08", AUG_START, AUG_END, SalaryStatus.CALCULATED, 1,
                new BigDecimal("30000"));
    }

    private static SalaryCalculation calculation(
            long id,
            long consultantId,
            String period,
            LocalDate start,
            LocalDate end,
            SalaryStatus status,
            int sessions,
            BigDecimal net) {
        User consultant = new User();
        consultant.setId(consultantId);
        SalaryCalculation row = SalaryCalculation.builder()
                .consultant(consultant)
                .calculationPeriod(period)
                .calculationPeriodStart(start)
                .calculationPeriodEnd(end)
                .totalConsultations(sessions)
                .completedConsultations(sessions)
                .grossSalary(net)
                .netSalary(net)
                .deductions(BigDecimal.ZERO)
                .totalSalary(net)
                .status(status)
                .calculationKind(CalculationKind.PRIMARY)
                .build();
        row.setId(id);
        row.setTenantId(TENANT_A);
        return row;
    }

    private static void applyRecalculated(
            SalaryCalculation row,
            int completed,
            BigDecimal gross,
            BigDecimal net,
            BigDecimal tax) {
        row.setCompletedConsultations(completed);
        row.setGrossSalary(gross);
        row.setNetSalary(net);
        row.setDeductions(tax);
        row.setTotalSalary(gross);
    }

    private static Map<String, Object> previewOfNine() {
        Map<String, Object> preview = new HashMap<>();
        preview.put("success", Boolean.TRUE);
        preview.put("calculationId", EARLY_ID);
        preview.put("completedConsultations", 9);
        preview.put("grossSalary", PREVIEW_GROSS);
        preview.put("taxAmount", PREVIEW_TAX);
        preview.put("netSalary", PREVIEW_NET);
        preview.put("message", "미지급 급여를 다시 계산했습니다.");
        return preview;
    }
}
