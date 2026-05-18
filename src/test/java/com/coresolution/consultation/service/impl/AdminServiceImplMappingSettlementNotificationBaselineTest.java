package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 매칭 결제·입금·승인 API — {@link MappingSettlementNotificationHelper} 연동 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 매칭 정산 알림")
class AdminServiceImplMappingSettlementNotificationBaselineTest {

    private static final String TEST_TENANT_ID = "tenant-notif-baseline-" + UUID.randomUUID();

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
        AdminServiceImpl real = new AdminServiceImpl(
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
                professionalProviderTypeService,
                mappingSettlementNotificationHelper);
        adminService = Mockito.spy(real);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("confirm-payment(4인자): MappingSettlementNotificationHelper PAYMENT_CONFIRMED")
    void confirmPayment_fourArg_dispatchesSettlementNotification() {
        Long mappingId = 100L;
        ConsultantClientMapping mapping = buildMapping(mappingId, 10L, 20L,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED,
                ConsultantClientMapping.PaymentStatus.PENDING, 100_000L);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));

        adminService.confirmPayment(mappingId, "CARD", "REF-PAY-001", 100_000L);

        verify(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(
                any(ConsultantClientMapping.class), eq(TEST_TENANT_ID), eq(MappingSettlementScenario.PAYMENT_CONFIRMED));
        verify(consultationMessageService, never()).sendMessage(any(), any(), any(), any(), any(), any(), any(), any(),
                any());
    }

    @Test
    @DisplayName("confirm-deposit: DEPOSIT_CONFIRMED 알림 헬퍼 호출")
    void confirmDeposit_dispatchesDepositNotification() {
        Long mappingId = 101L;
        ConsultantClientMapping mapping = buildMapping(mappingId, 11L, 21L,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED,
                ConsultantClientMapping.PaymentStatus.CONFIRMED, 50_000L);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true));

        adminService.confirmDeposit(mappingId, "REF-DEP-001");

        verify(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(
                any(ConsultantClientMapping.class), eq(TEST_TENANT_ID), eq(MappingSettlementScenario.DEPOSIT_CONFIRMED));
        verify(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("approve: MAPPING_APPROVED 알림 헬퍼 호출")
    void approveMapping_dispatchesApprovedNotification() {
        Long mappingId = 102L;
        ConsultantClientMapping mapping = buildMapping(mappingId, 12L, 22L,
                ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING,
                ConsultantClientMapping.PaymentStatus.APPROVED, 80_000L);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.approveMapping(mappingId, "AdminTester");

        verify(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(
                any(ConsultantClientMapping.class), eq(TEST_TENANT_ID), eq(MappingSettlementScenario.MAPPING_APPROVED));
    }

    private ConsultantClientMapping buildMapping(
            Long mappingId,
            Long consultantUserId,
            Long clientUserId,
            ConsultantClientMapping.MappingStatus status,
            ConsultantClientMapping.PaymentStatus paymentStatus,
            long packagePrice) {
        User consultant = new User();
        consultant.setId(consultantUserId);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(clientUserId);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("baseline-package");
        m.setPackagePrice(packagePrice);
        m.setPaymentAmount(packagePrice);
        m.setTotalSessions(10);
        m.setRemainingSessions(3);
        m.setPaymentReference("PAY-REF");
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setTenantId(TEST_TENANT_ID);
        return m;
    }
}
