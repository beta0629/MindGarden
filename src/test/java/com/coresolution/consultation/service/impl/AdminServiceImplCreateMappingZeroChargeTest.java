package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
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
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
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
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 관리자 일반 회기 0원 배정은 createMappingFromAdmin 직후 결제·ERP 없이 ACTIVE·회기 부여.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl createMappingFromAdmin 0원 일반 배정 즉시 활성화")
class AdminServiceImplCreateMappingZeroChargeTest {

    private static final String TEST_TENANT_ID = "tenant-zero-charge-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 801L;
    private static final Long CLIENT_ID = 802L;

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
    @Mock private PaymentRepository paymentRepository;

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
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
                userRepository, consultantRepository, clientRepository, mappingRepository,
                consultantRatingRepository, consultantRatingService, scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository, commonCodeService, passwordService, encryptionUtil,
                consultantAvailabilityService, consultationMessageService, branchService,
                notificationService, financialTransactionService, cardMerchantFeeResolutionService, paymentMethodSsotService, realTimeStatisticsService,
                financialTransactionRepository, amountManagementService, storedProcedureService,
                userRoleAssignmentRepository, tenantRoleRepository, userRoleQueryService,
                statusCodeHelper, userPersonalDataCacheService, scheduleListUserFieldsResolver,
                consultantStatsService, clientStatsService,
                notificationChannelPreferenceResolutionService, passwordResetService,
                noopTransactionManager, userIdGenerator, userService,
                consultantSalaryProfileRepository, scheduleService, org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class), professionalProviderTypeService,
                mappingSettlementNotificationHelper, batchNotificationDispatchService,
                refundAutoCancelNotificationService, userLifecycleService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                paymentRepository);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);

        consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setName("테스트상담사");

        client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);
        client.setName("테스트내담자");

        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(client));
        org.mockito.Mockito.lenient().when(userRepository.lockClientRowForMappingCreate(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(CLIENT_ID));
        when(mappingRepository.findByTenantIdAndConsultantAndClientAndStatusIn(
                eq(TEST_TENANT_ID), eq(consultant), eq(client), anyCollection()))
                .thenReturn(List.<ConsultantClientMapping>of());
        org.mockito.Mockito.lenient().when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(String.class), any()))
                .thenReturn(false);
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(1001L);
            }
            return m;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ConsultantClientMappingCreateRequest request(long packagePrice, String paymentTiming) {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(CONSULTANT_ID);
        dto.setClientId(CLIENT_ID);
        dto.setTotalSessions(5);
        dto.setPackageName("무료 회기");
        dto.setPackagePrice(packagePrice);
        dto.setPaymentAmount(packagePrice);
        dto.setPaymentTiming(paymentTiming);
        dto.setStatus(MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(PaymentStatus.PENDING.name());
        return dto;
    }

    @Test
    @DisplayName("일반 선납 0원 배정은 즉시 ACTIVE, 회기 부여, INCOME·Payment 저장 0회")
    void createMappingFromAdmin_zeroChargeAdvance_activatesWithSessionsAndNoLedgerOrPayment() {
        ConsultantClientMapping saved = adminService.createMappingFromAdmin(
                request(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE));

        assertThat(saved.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(saved.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(saved.getRemainingSessions()).isEqualTo(5);
        assertThat(saved.getPackagePrice()).isEqualTo(PaymentConstants.ZERO_PAYMENT_AMOUNT);
        assertThat(saved.getNotes()).contains(AdminServiceUserFacingMessages.NOTES_ZERO_CHARGE_ACTIVATED);
        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("유료 선납 배정은 PENDING_PAYMENT 유지, 회기 미부여")
    void createMappingFromAdmin_paidAdvance_staysPending() {
        ConsultantClientMapping saved = adminService.createMappingFromAdmin(
                request(PaymentConstants.MIN_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE));

        assertThat(saved.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(saved.getRemainingSessions()).isZero();
        assertThat(saved.getNotes()).isNull();
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("당일카드 0원은 즉시 활성화하지 않고 PENDING_PAYMENT 유지")
    void createMappingFromAdmin_zeroChargeSameDayCard_staysPending() {
        ConsultantClientMapping saved = adminService.createMappingFromAdmin(
                request(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.SAME_DAY_CARD));

        assertThat(saved.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(saved.getRemainingSessions()).isZero();
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("createMapping(비관리자 경로) 0원은 자동 활성화하지 않는다")
    void createMapping_zeroCharge_doesNotAutoActivate() {
        ConsultantClientMapping saved = adminService.createMapping(
                request(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE));

        assertThat(saved.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(saved.getRemainingSessions()).isZero();
    }
}
