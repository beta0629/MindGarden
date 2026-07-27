package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * SalaryBatchServiceImpl#getBatchStatus 단위 테스트.
 * 처리됨 = CALCULATED|APPROVED|PAID (상담사 distinct), CANCELLED 제외.
 *
 * @author MindGarden
 * @since 2026-07-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryBatchServiceImpl getBatchStatus")
class SalaryBatchServiceImplGetBatchStatusTest {

    private static final String TENANT_ID = "test-tenant";
    private static final int YEAR = 2026;
    private static final int MONTH = 6;
    private static final LocalDate PERIOD_START = LocalDate.of(2026, 5, 26);
    private static final LocalDate PERIOD_END = LocalDate.of(2026, 6, 25);

    @Mock
    private UserRepository userRepository;
    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private PlSqlSalaryManagementService plSqlSalaryManagementService;
    @Mock
    private SalaryScheduleService salaryScheduleService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private BranchService branchService;

    @InjectMocks
    private SalaryBatchServiceImpl salaryBatchService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private void stubCalculationPeriod() {
        when(salaryScheduleService.getCalculationPeriod(YEAR, MONTH))
                .thenReturn(new LocalDate[] {PERIOD_START, PERIOD_END});
    }

    private User consultant(long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private SalaryCalculation calc(User consultant, SalaryCalculation.SalaryStatus status) {
        SalaryCalculation sc = new SalaryCalculation();
        sc.setConsultant(consultant);
        sc.setStatus(status);
        sc.setCreatedAt(LocalDateTime.of(2026, 6, 26, 2, 0));
        return sc;
    }

    @Nested
    @DisplayName("처리 완료 판정")
    class CompletedStatus {

        @BeforeEach
        void stubPeriod() {
            stubCalculationPeriod();
        }

        @Test
        @DisplayName("1 APPROVED + 1 CALCULATED (활성 상담사 2명) → COMPLETED")
        void approvedAndCalculated_countsAsCompleted() {
            User c1 = consultant(1L);
            User c2 = consultant(2L);
            when(userRepository.findByRoleAndIsActiveTrue(TENANT_ID, UserRole.CONSULTANT))
                    .thenReturn(List.of(c1, c2));
            when(salaryCalculationRepository
                    .findByTenantIdAndStatusInAndCalculationPeriodStartBetweenWithConsultant(
                            eq(TENANT_ID), any(), eq(PERIOD_START), eq(PERIOD_END)))
                    .thenReturn(List.of(
                            calc(c1, SalaryCalculation.SalaryStatus.APPROVED),
                            calc(c2, SalaryCalculation.SalaryStatus.CALCULATED)
                    ));
            when(commonCodeService.getCodeValue("BATCH_STATUS", "COMPLETED"))
                    .thenReturn("COMPLETED");

            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(YEAR, MONTH);

            assertThat(status.getStatus()).isEqualTo("COMPLETED");
            assertThat(status.getTotalConsultants()).isEqualTo(2);
            assertThat(status.getProcessedConsultants()).isEqualTo(2);
        }

        @Test
        @DisplayName("동일 상담사 중복 레코드는 distinct 1로 집계")
        void duplicateRowsForSameConsultant_countOnce() {
            User c1 = consultant(1L);
            when(userRepository.findByRoleAndIsActiveTrue(TENANT_ID, UserRole.CONSULTANT))
                    .thenReturn(List.of(c1));
            when(salaryCalculationRepository
                    .findByTenantIdAndStatusInAndCalculationPeriodStartBetweenWithConsultant(
                            eq(TENANT_ID), any(), eq(PERIOD_START), eq(PERIOD_END)))
                    .thenReturn(List.of(
                            calc(c1, SalaryCalculation.SalaryStatus.CALCULATED),
                            calc(c1, SalaryCalculation.SalaryStatus.APPROVED)
                    ));
            when(commonCodeService.getCodeValue("BATCH_STATUS", "COMPLETED"))
                    .thenReturn("COMPLETED");

            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(YEAR, MONTH);

            assertThat(status.getStatus()).isEqualTo("COMPLETED");
            assertThat(status.getProcessedConsultants()).isEqualTo(1);
        }

        @Test
        @DisplayName("조회 시 CALCULATED|APPROVED|PAID 상태 집합을 전달한다")
        void queriesWithProcessedStatusSet() {
            when(userRepository.findByRoleAndIsActiveTrue(TENANT_ID, UserRole.CONSULTANT))
                    .thenReturn(List.of());
            ArgumentCaptor<Collection<SalaryCalculation.SalaryStatus>> statusesCaptor =
                    ArgumentCaptor.forClass(Collection.class);
            when(salaryCalculationRepository
                    .findByTenantIdAndStatusInAndCalculationPeriodStartBetweenWithConsultant(
                            eq(TENANT_ID), statusesCaptor.capture(), eq(PERIOD_START), eq(PERIOD_END)))
                    .thenReturn(List.of());
            when(commonCodeService.getCodeValue("BATCH_STATUS", "PENDING"))
                    .thenReturn("PENDING");

            salaryBatchService.getBatchStatus(YEAR, MONTH);

            assertThat(statusesCaptor.getValue()).containsExactlyInAnyOrder(
                    SalaryCalculation.SalaryStatus.CALCULATED,
                    SalaryCalculation.SalaryStatus.APPROVED,
                    SalaryCalculation.SalaryStatus.PAID
            );
            assertThat(statusesCaptor.getValue())
                    .doesNotContain(SalaryCalculation.SalaryStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("미완료 판정")
    class IncompleteStatus {

        @BeforeEach
        void stubPeriod() {
            stubCalculationPeriod();
        }

        @Test
        @DisplayName("활성 2명 중 1명만 처리 → IN_PROGRESS")
        void partialProcessed_isInProgress() {
            User c1 = consultant(1L);
            User c2 = consultant(2L);
            when(userRepository.findByRoleAndIsActiveTrue(TENANT_ID, UserRole.CONSULTANT))
                    .thenReturn(List.of(c1, c2));
            when(salaryCalculationRepository
                    .findByTenantIdAndStatusInAndCalculationPeriodStartBetweenWithConsultant(
                            eq(TENANT_ID), any(), eq(PERIOD_START), eq(PERIOD_END)))
                    .thenReturn(List.of(calc(c1, SalaryCalculation.SalaryStatus.PAID)));
            when(commonCodeService.getCodeValue("BATCH_STATUS", "IN_PROGRESS"))
                    .thenReturn("IN_PROGRESS");

            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(YEAR, MONTH);

            assertThat(status.getStatus()).isEqualTo("IN_PROGRESS");
            assertThat(status.getProcessedConsultants()).isEqualTo(1);
            assertThat(status.getTotalConsultants()).isEqualTo(2);
        }

        @Test
        @DisplayName("처리 기록 없음 → PENDING")
        void noneProcessed_isPending() {
            when(userRepository.findByRoleAndIsActiveTrue(TENANT_ID, UserRole.CONSULTANT))
                    .thenReturn(List.of(consultant(1L)));
            when(salaryCalculationRepository
                    .findByTenantIdAndStatusInAndCalculationPeriodStartBetweenWithConsultant(
                            eq(TENANT_ID), any(), eq(PERIOD_START), eq(PERIOD_END)))
                    .thenReturn(List.of());
            when(commonCodeService.getCodeValue("BATCH_STATUS", "PENDING"))
                    .thenReturn("PENDING");

            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(YEAR, MONTH);

            assertThat(status.getStatus()).isEqualTo("PENDING");
            assertThat(status.getProcessedConsultants()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("canExecuteBatch")
    class CanExecuteBatch {

        @Test
        @DisplayName("마감일 당일·이후이면 실행 가능")
        void afterOrOnCutoff_canExecute() {
            LocalDate target = LocalDate.of(2026, 6, 15);
            when(salaryScheduleService.getCutoffDate(anyInt(), anyInt()))
                    .thenReturn(LocalDate.now().minusDays(1));

            assertThat(salaryBatchService.canExecuteBatch(target)).isTrue();
        }

        @Test
        @DisplayName("마감일 이전이면 실행 불가")
        void beforeCutoff_cannotExecute() {
            LocalDate target = LocalDate.of(2026, 6, 15);
            when(salaryScheduleService.getCutoffDate(anyInt(), anyInt()))
                    .thenReturn(LocalDate.now().plusDays(5));

            assertThat(salaryBatchService.canExecuteBatch(target)).isFalse();
        }
    }
}
