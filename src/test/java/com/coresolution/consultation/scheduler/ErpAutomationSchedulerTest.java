package com.coresolution.consultation.scheduler;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.consultation.service.PlSqlFinancialService;
import com.coresolution.consultation.service.erp.ErpFinancialCloseService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Scheduled;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ErpAutomationScheduler 단위 테스트.
 * 테넌트별 TenantContextHolder 설정 및 예외 시 다음 테넌트 계속 실행 검증.
 * 핫픽스 (2026-07-31): 전 {@code @Scheduled} 메서드 {@code @SchedulerLock} 메타데이터 검증.
 *
 * @author CoreSolution
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ErpAutomationScheduler 단위 테스트")
class ErpAutomationSchedulerTest {

    @Mock
    private TenantService tenantService;

    @Mock
    private ErpFinancialCloseService erpFinancialCloseService;

    @Mock
    private FinancialStatementService financialStatementService;

    @Mock
    private ErpService erpService;

    @Mock
    private SettlementService settlementService;

    @Mock
    private PlSqlFinancialService plSqlFinancialService;

    @Mock
    private PlSqlMappingSyncService plSqlMappingSyncService;

    @Mock
    private AccountingService accountingService;

    @Mock
    private ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;

    @InjectMocks
    private ErpAutomationScheduler scheduler;

    @BeforeEach
    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("scheduleDailyFinancialClose - 활성 테넌트별로 TenantContext 설정 후 performDailyClose 호출")
    void scheduleDailyFinancialClose_callsPerformDailyClosePerTenant() {
        List<String> tenantIds = List.of("tenant-1", "tenant-2");
        when(tenantService.getAllActiveTenantIds()).thenReturn(tenantIds);

        scheduler.scheduleDailyFinancialClose();

        ArgumentCaptor<String> tenantIdCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<LocalDate> dateCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(erpFinancialCloseService, times(2)).performDailyClose(tenantIdCaptor.capture(), dateCaptor.capture());

        List<String> capturedTenantIds = tenantIdCaptor.getAllValues();
        List<LocalDate> capturedDates = dateCaptor.getAllValues();
        LocalDate expectedDate = LocalDate.now().minusDays(1);

        assertThat(capturedTenantIds).containsExactly("tenant-1", "tenant-2");
        assertThat(capturedDates).containsExactly(expectedDate, expectedDate);

        InOrder inOrder = inOrder(erpFinancialCloseService);
        inOrder.verify(erpFinancialCloseService).performDailyClose("tenant-1", expectedDate);
        inOrder.verify(erpFinancialCloseService).performDailyClose("tenant-2", expectedDate);
    }

    @Test
    @DisplayName("scheduleDailyFinancialClose - 한 테넌트에서 예외 발생 시 다음 테넌트는 계속 실행")
    void scheduleDailyFinancialClose_oneTenantThrows_continuesToNext() {
        List<String> tenantIds = List.of("tenant-fail", "tenant-ok");
        when(tenantService.getAllActiveTenantIds()).thenReturn(tenantIds);
        doThrow(new RuntimeException("테스트 예외")).when(erpFinancialCloseService)
            .performDailyClose(eq("tenant-fail"), any(LocalDate.class));

        scheduler.scheduleDailyFinancialClose();

        ArgumentCaptor<String> tenantIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(erpFinancialCloseService, times(2)).performDailyClose(tenantIdCaptor.capture(), any(LocalDate.class));
        assertThat(tenantIdCaptor.getAllValues()).containsExactly("tenant-fail", "tenant-ok");
    }

    @Test
    @DisplayName("scheduleDailyFinancialClose - 활성 테넌트 0개일 때 NPE 없이 종료")
    void scheduleDailyFinancialClose_zeroTenants_noCall() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of());

        scheduler.scheduleDailyFinancialClose();

        verify(erpFinancialCloseService, never()).performDailyClose(any(), any(LocalDate.class));
    }

    @Nested
    @DisplayName("@SchedulerLock 어노테이션 메타데이터 (reflection)")
    class SchedulerLockMetadata {

        @Test
        @DisplayName("모든 @Scheduled 메서드에 @SchedulerLock 이 존재하고 lock name 이 유일하다")
        void allScheduledMethods_haveUniqueSchedulerLock() {
            List<Method> scheduledMethods = Arrays.stream(ErpAutomationScheduler.class.getDeclaredMethods())
                .filter(m -> m.getAnnotation(Scheduled.class) != null)
                .collect(Collectors.toList());

            assertThat(scheduledMethods)
                .as("@Scheduled 메서드가 1개 이상이어야 한다")
                .isNotEmpty();

            for (Method method : scheduledMethods) {
                SchedulerLock lock = method.getAnnotation(SchedulerLock.class);
                assertThat(lock)
                    .as("%s 는 blue/green 동시 실행 차단을 위해 @SchedulerLock 이 필요하다", method.getName())
                    .isNotNull();
                assertThat(lock.name())
                    .as("%s lock name 은 ErpAutomationScheduler_ 접두사를 써야 한다", method.getName())
                    .startsWith("ErpAutomationScheduler_");
                assertThat(lock.lockAtMostFor()).isNotBlank();
                assertThat(lock.lockAtLeastFor()).isNotBlank();
            }

            Set<String> lockNames = scheduledMethods.stream()
                .map(m -> m.getAnnotation(SchedulerLock.class).name())
                .collect(Collectors.toSet());
            assertThat(lockNames)
                .as("잡끼리 락이 서로 차단되지 않도록 lock name 은 유일해야 한다")
                .hasSize(scheduledMethods.size());
        }

        @Test
        @DisplayName("DailyFinancialClose — name·lockAtMostFor=PT30M·lockAtLeastFor=PT1M")
        void scheduleDailyFinancialClose_hasExpectedLock() throws NoSuchMethodException {
            Method method = ErpAutomationScheduler.class
                .getDeclaredMethod("scheduleDailyFinancialClose");
            SchedulerLock lock = method.getAnnotation(SchedulerLock.class);

            assertThat(lock).isNotNull();
            assertThat(lock.name()).isEqualTo("ErpAutomationScheduler_scheduleDailyFinancialClose");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT1M");
        }

        @Test
        @DisplayName("MonthlyFinancialClose — name·lockAtMostFor=PT30M·lockAtLeastFor=PT1M")
        void scheduleMonthlyFinancialClose_hasExpectedLock() throws NoSuchMethodException {
            Method method = ErpAutomationScheduler.class
                .getDeclaredMethod("scheduleMonthlyFinancialClose");
            SchedulerLock lock = method.getAnnotation(SchedulerLock.class);

            assertThat(lock).isNotNull();
            assertThat(lock.name()).isEqualTo("ErpAutomationScheduler_scheduleMonthlyFinancialClose");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT1M");
        }
    }
}
