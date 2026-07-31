package com.coresolution.consultation.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

/**
 * {@link SalaryBatchScheduler} 단위 테스트.
 *
 * <p>핫픽스 (2026-07-31): 루프 밖 {@code getBatchStatus} 가 테넌트 컨텍스트 없이
 * {@code getRequiredTenantId} 를 호출하던 문제를 회귀 방지한다. COMPLETED 는
 * 테넌트별로 skip 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-07-31
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryBatchScheduler — 테넌트별 COMPLETED 게이트")
class SalaryBatchSchedulerTest {

    private static final String TENANT_DONE = "tenant-done";
    private static final String TENANT_PENDING = "tenant-pending";

    @Mock
    private SalaryBatchService salaryBatchService;
    @Mock
    private SalaryScheduleService salaryScheduleService;
    @Mock
    private TenantService tenantService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;
    @Mock
    private ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;

    @InjectMocks
    private SalaryBatchScheduler scheduler;

    @BeforeEach
    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Nested
    @DisplayName("checkAndExecuteSalaryBatch")
    class CheckAndExecuteSalaryBatch {

        @Test
        @DisplayName("테넌트 컨텍스트 없이 진입해도 getBatchStatus(→ getRequiredTenantId) 미호출")
        void entryWithoutTenantContext_doesNotCallGetBatchStatus() {
            LocalDate previousMonth = LocalDate.now().minusMonths(1);
            when(salaryBatchService.canExecuteBatch(previousMonth)).thenReturn(true);
            when(tenantService.getAllActiveTenantIds()).thenReturn(List.of());

            assertThat(TenantContextHolder.getTenantId()).isNull();

            scheduler.checkAndExecuteSalaryBatch();

            verify(salaryBatchService).canExecuteBatch(previousMonth);
            verify(salaryBatchService, never()).getBatchStatus(anyInt(), anyInt());
            verify(salaryBatchService, never()).executeMonthlySalaryBatch(anyInt(), anyInt(), any());
        }

        @Test
        @DisplayName("canExecuteBatch=false 이면 조기 return — getBatchStatus·테넌트 조회 없음")
        void canExecuteBatchFalse_skipsWithoutGetBatchStatus() {
            LocalDate previousMonth = LocalDate.now().minusMonths(1);
            when(salaryBatchService.canExecuteBatch(previousMonth)).thenReturn(false);

            scheduler.checkAndExecuteSalaryBatch();

            verify(salaryBatchService).canExecuteBatch(previousMonth);
            verify(salaryBatchService, never()).getBatchStatus(anyInt(), anyInt());
            verify(tenantService, never()).getAllActiveTenantIds();
            verify(salaryBatchService, never()).executeMonthlySalaryBatch(anyInt(), anyInt(), any());
        }

        @Test
        @DisplayName("테넌트 COMPLETED 이면 executeMonthlySalaryBatch skip, PENDING 은 실행")
        void completedTenant_skipped_pendingTenant_executed() {
            LocalDate previousMonth = LocalDate.now().minusMonths(1);
            int year = previousMonth.getYear();
            int month = previousMonth.getMonthValue();

            when(salaryBatchService.canExecuteBatch(previousMonth)).thenReturn(true);
            when(tenantService.getAllActiveTenantIds())
                .thenReturn(List.of(TENANT_DONE, TENANT_PENDING));
            when(salaryBatchService.getBatchStatus(year, month))
                .thenReturn(new SalaryBatchService.BatchStatus("COMPLETED"))
                .thenReturn(new SalaryBatchService.BatchStatus("PENDING"));
            when(salaryBatchService.executeMonthlySalaryBatch(eq(year), eq(month), isNull()))
                .thenReturn(new SalaryBatchService.BatchResult(true, "ok"));

            scheduler.checkAndExecuteSalaryBatch();

            verify(salaryBatchService, times(2)).getBatchStatus(year, month);
            verify(salaryBatchService, times(1))
                .executeMonthlySalaryBatch(eq(year), eq(month), isNull());
            verify(logService).saveExecutionLog(
                anyString(), eq(TENANT_PENDING), eq("SalaryBatchScheduler"),
                eq("SUCCESS"), anyString());
            verify(logService, never()).saveExecutionLog(
                anyString(), eq(TENANT_DONE), anyString(), anyString(), anyString());
        }
    }
}
