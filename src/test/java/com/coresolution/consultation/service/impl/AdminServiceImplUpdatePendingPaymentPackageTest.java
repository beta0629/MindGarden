package com.coresolution.consultation.service.impl;

import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.PendingPaymentPackageUpdateRequest;
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
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#updatePendingPaymentPackage — 가계약(PENDING_PAYMENT) 전용 패키지 수정 회귀.
 *
 * <p>동일 매핑 write SSOT. remaining/used 유지, ERP/스케줄/ScheduleSlotGuard 미호출.</p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl updatePendingPaymentPackage — 가계약 패키지 변경")
class AdminServiceImplUpdatePendingPaymentPackageTest {

    private static final String TEST_TENANT_ID = "tenant-pending-pkg-" + UUID.randomUUID();

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
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
    @Mock private SalaryTaxRateLookupService salaryTaxRateLookupService;

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
        adminService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
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
                salaryTaxRateLookupService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PENDING_PAYMENT 성공 — 패키지 필드만 갱신, remaining/used 0 유지, ERP·스케줄 미호출")
    void updatePendingPaymentPackage_pending_success_preservesSessions_skipsErpAndSchedule() {
        Long mappingId = 501L;
        ConsultantClientMapping mapping = newPendingMapping(mappingId);
        mapping.setPackageName("단회기");
        mapping.setPackagePrice(50_000L);
        mapping.setTotalSessions(1);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        stubPendingStatusCodes();

        PendingPaymentPackageUpdateRequest request = PendingPaymentPackageUpdateRequest.builder()
                .packageName("표준 10회기")
                .packagePrice(500_000L)
                .totalSessions(10)
                .build();

        ConsultantClientMapping saved = adminService.updatePendingPaymentPackage(mappingId, request, "admin");

        assertThat(saved.getPackageName()).isEqualTo("표준 10회기");
        assertThat(saved.getPackagePrice()).isEqualTo(500_000L);
        assertThat(saved.getTotalSessions()).isEqualTo(10);
        assertThat(saved.getRemainingSessions()).isEqualTo(0);
        assertThat(saved.getUsedSessions()).isEqualTo(0);
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(saved.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), any(), any(), any());
        verifyNoInteractions(scheduleService);
        verifyNoInteractions(financialTransactionService);
        verify(scheduleRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = MappingStatus.class, names = {
            "ACTIVE", "TERMINATED", "CANCELLED", "SESSIONS_EXHAUSTED",
            "PAYMENT_CONFIRMED", "DEPOSIT_PENDING", "SUSPENDED", "INACTIVE"
    })
    @DisplayName("비 PENDING 상태 → IllegalStateException")
    void updatePendingPaymentPackage_rejectsNonPendingStatus(MappingStatus status) {
        Long mappingId = 502L;
        ConsultantClientMapping mapping = newPendingMapping(mappingId);
        mapping.setStatus(status);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(statusCodeHelper.getStatusCodeValue(eq(MappingStatusConstants.MAPPING_STATUS_GROUP),
                eq(MappingStatusConstants.PENDING_PAYMENT)))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());

        PendingPaymentPackageUpdateRequest request = PendingPaymentPackageUpdateRequest.builder()
                .packageName("표준")
                .packagePrice(100_000L)
                .totalSessions(5)
                .build();

        assertThatThrownBy(() -> adminService.updatePendingPaymentPackage(mappingId, request, "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_PENDING_PACKAGE_STATUS_NOT_ALLOWED);

        verify(mappingRepository, never()).save(any());
        verifyNoInteractions(storedProcedureService);
        verifyNoInteractions(scheduleService);
    }

    @Test
    @DisplayName("PENDING_PAYMENT 이지만 paymentStatus≠PENDING → 거부")
    void updatePendingPaymentPackage_rejectsNonPendingPaymentStatus() {
        Long mappingId = 503L;
        ConsultantClientMapping mapping = newPendingMapping(mappingId);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        stubPendingStatusCodes();

        PendingPaymentPackageUpdateRequest request = PendingPaymentPackageUpdateRequest.builder()
                .packageName("표준")
                .packagePrice(100_000L)
                .totalSessions(5)
                .build();

        assertThatThrownBy(() -> adminService.updatePendingPaymentPackage(mappingId, request, "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_PENDING_PACKAGE_PAYMENT_STATUS_NOT_ALLOWED);

        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("과거 start_time 스케줄이 있어도 패키지 수정 성공 (ScheduleSlotGuard/스케줄 API 미호출)")
    void updatePendingPaymentPackage_succeedsEvenWhenPastScheduleExists_withoutScheduleGuard() {
        Long mappingId = 504L;
        ConsultantClientMapping mapping = newPendingMapping(mappingId);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        stubPendingStatusCodes();

        PendingPaymentPackageUpdateRequest request = PendingPaymentPackageUpdateRequest.builder()
                .packageName("프리미엄")
                .packagePrice(800_000L)
                .totalSessions(20)
                .build();

        ConsultantClientMapping saved = adminService.updatePendingPaymentPackage(mappingId, request, "admin");

        assertThat(saved.getPackageName()).isEqualTo("프리미엄");
        assertThat(saved.getTotalSessions()).isEqualTo(20);
        assertThat(saved.getRemainingSessions()).isEqualTo(0);
        // 과거 슬롯과 무관 — scheduleService / ScheduleSlotGuard 경로 없음
        verifyNoInteractions(scheduleService);
        verify(scheduleRepository, never()).findByTenantIdAndId(any(), any());
    }

    private void stubPendingStatusCodes() {
        when(statusCodeHelper.getStatusCodeValue(eq(MappingStatusConstants.MAPPING_STATUS_GROUP),
                eq(MappingStatusConstants.PENDING_PAYMENT)))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq(MappingStatusConstants.PAYMENT_STATUS_GROUP),
                eq(MappingStatusConstants.PENDING)))
                .thenReturn(PaymentStatus.PENDING.name());
    }

    private ConsultantClientMapping newPendingMapping(Long mappingId) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setPackageName("placeholder");
        mapping.setPackagePrice(0L);
        mapping.setTotalSessions(1);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        return mapping;
    }
}
