package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminRequestIdempotencyService;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * terminateMapping — 미사용 전액 무효 시 관련 INCOME CANCELLED + EXPENSE 환불 스킵.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl terminateMapping — unused full void INCOME reverse")
class AdminServiceImplTerminateUnusedFullVoidTest {

    private static final String TEST_TENANT_ID = "tenant-void-" + UUID.randomUUID();

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private FinancialTransactionRepository financialTransactionRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private AdminRequestIdempotencyService adminRequestIdempotencyService;

    private final PlatformTransactionManager noopTransactionManager = new AbstractPlatformTransactionManager() {
        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    };

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        adminService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
                cardMerchantFeeResolutionService,
                paymentMethodSsotService,
                realTimeStatisticsService,
                financialTransactionRepository,
                amountManagementService,
                storedProcedureService,
                userRoleAssignmentRepository,
                tenantRoleRepository,
                userRoleQueryService,
                statusCodeHelper,
                userPersonalDataCacheService,
                scheduleListUserFieldsResolver,
                consultantStatsService,
                clientStatsService,
                notificationChannelPreferenceResolutionService,
                passwordResetService,
                noopTransactionManager,
                userIdGenerator,
                userService,
                consultantSalaryProfileRepository,
                scheduleService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                userLifecycleService,
                adminRequestIdempotencyService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                org.mockito.Mockito.mock(org.springframework.beans.factory.ObjectProvider.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("remaining==total(미사용) → INCOME CANCELLED, createTransaction(EXPENSE) 미호출")
    void terminateMapping_unusedFullVoid_cancelsIncomeAndSkipsExpenseRefund() {
        Long mappingId = 228L;
        ConsultantClientMapping mapping = newActiveUnusedMapping(mappingId, 10L, 20L, 10, 800_000L);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("CANCELLED")))
                .thenReturn(MappingStatus.CANCELLED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("PAYMENT_STATUS"), eq("REFUNDED")))
                .thenReturn(PaymentStatus.REFUNDED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("BOOKED")))
                .thenReturn(ScheduleStatus.BOOKED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CONFIRMED")))
                .thenReturn(ScheduleStatus.CONFIRMED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(10L), eq(20L), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(financialTransactionService.cancelRelatedPostedIncomeTransactions(
                eq(mappingId),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)))
                .thenReturn(1);

        adminService.terminateMapping(mappingId, "미사용 전액 무효");

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        verify(financialTransactionService).cancelRelatedPostedIncomeTransactions(
                eq(mappingId),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING));
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("부분 사용(0<remaining<total) → INCOME 취소 없음, EXPENSE 환불 생성")
    void terminateMapping_partialRemaining_keepsIncomeCreatesExpenseRefund() {
        Long mappingId = 229L;
        ConsultantClientMapping mapping = newActiveUnusedMapping(mappingId, 11L, 21L, 10, 800_000L);
        mapping.setRemainingSessions(3);
        mapping.setUsedSessions(7);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("CANCELLED")))
                .thenReturn(MappingStatus.CANCELLED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("PAYMENT_STATUS"), eq("REFUNDED")))
                .thenReturn(PaymentStatus.REFUNDED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("BOOKED")))
                .thenReturn(ScheduleStatus.BOOKED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CONFIRMED")))
                .thenReturn(ScheduleStatus.CONFIRMED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(11L), eq(21L), any(LocalDate.class)))
                .thenReturn(List.of());
        when(financialTransactionService.createTransaction(any(), any()))
                .thenReturn(null);

        adminService.terminateMapping(mappingId, "부분 환불 종료");

        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(
                anyLong(), anyString());
        verify(financialTransactionService).createTransaction(any(), any());
    }

    @Test
    @DisplayName("미병합 추가 패키지(DEPOSIT_PENDING, 회기 0) 환불 → 추가 회기 INCOME CANCELLED, EXPENSE·일정·통지 없음")
    void terminateMapping_unmergedZeroSessionAdditional_voidsAdditionalIncomeOnly() {
        Long mappingId = 230L;
        ConsultantClientMapping mapping = newUnmergedAdditionalMapping(mappingId, 12L, 22L,
                MappingStatus.DEPOSIT_PENDING, 0, 250_000L, 229L);

        stubUnmergedAdditionalTerminateCodes(mapping);
        when(financialTransactionService.cancelRelatedPostedIncomeTransactions(
                eq(mappingId),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL)))
                .thenReturn(1);

        adminService.terminateMapping(mappingId, "회기 0 추가 수입 오등록 취소");

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(mapping.getTerminatedAt()).isNotNull();
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getNotes())
                .contains("추가 패키지 취소")
                .contains("회기 0 추가 수입 오등록 취소")
                .contains("추가 회기 수입 전표 1건 취소");
        verify(financialTransactionService).cancelRelatedPostedIncomeTransactions(
                mappingId, FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL);
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(
                anyLong(), eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING));
        verify(financialTransactionService, never()).createTransaction(any(), any());
        verifyNoInteractions(scheduleRepository, refundAutoCancelNotificationService);
        verify(notificationService, never()).sendRefundCompleted(any(), anyInt(), anyLong());
    }

    @Test
    @DisplayName("미병합 추가 패키지(PAYMENT_CONFIRMED) 환불 → 금액 0 EXPENSE 실패 대신 추가 회기 INCOME 무효")
    void terminateMapping_unmergedAdditionalPaymentConfirmed_doesNotRequireRefundAmount() {
        Long mappingId = 231L;
        ConsultantClientMapping mapping = newUnmergedAdditionalMapping(mappingId, 13L, 23L,
                MappingStatus.PAYMENT_CONFIRMED, 1, 250_000L, 229L);

        stubUnmergedAdditionalTerminateCodes(mapping);
        when(financialTransactionService.cancelRelatedPostedIncomeTransactions(
                eq(mappingId),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL)))
                .thenReturn(1);

        adminService.terminateMapping(mappingId, "추가 패키지 결제 취소");

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    private void stubUnmergedAdditionalTerminateCodes(ConsultantClientMapping mapping) {
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mapping.getId())))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("CANCELLED")))
                .thenReturn(MappingStatus.CANCELLED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("PAYMENT_STATUS"), eq("REFUNDED")))
                .thenReturn(PaymentStatus.REFUNDED.name());
    }

    private ConsultantClientMapping newUnmergedAdditionalMapping(Long mappingId, Long consultantId,
            Long clientId, MappingStatus status, int totalSessions, long packagePrice, Long activeMappingId) {
        ConsultantClientMapping mapping = newActiveUnusedMapping(mappingId, consultantId, clientId,
                totalSessions, packagePrice);
        mapping.setStatus(status);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setRemainingSessions(0);
        mapping.setPackageName("추가 패키지");
        mapping.setNotes(String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT,
                activeMappingId, totalSessions));
        return mapping;
    }

    private ConsultantClientMapping newActiveUnusedMapping(Long mappingId, Long consultantId,
            Long clientId, int totalSessions, long packagePrice) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setName("상담사");
        consultant.setTenantId(TEST_TENANT_ID);

        User client = new User();
        client.setId(clientId);
        client.setName("내담자");
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(totalSessions);
        mapping.setRemainingSessions(totalSessions);
        mapping.setUsedSessions(0);
        mapping.setPackagePrice(packagePrice);
        mapping.setPackageName("10회권");
        return mapping;
    }
}
