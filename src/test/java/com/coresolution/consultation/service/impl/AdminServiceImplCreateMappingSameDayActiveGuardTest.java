package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
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
import com.coresolution.consultation.service.PaymentMethodSsotService;
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
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.Collection;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ACTIVE remaining≥1 이면 SAME_DAY_CARD 매칭 생성 차단 가드.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl createMapping SAME_DAY_CARD × ACTIVE 잔여 가드")
class AdminServiceImplCreateMappingSameDayActiveGuardTest {

    private static final String TEST_TENANT_ID = "tenant-same-day-active-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 901L;
    private static final Long CLIENT_ID = 902L;

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
                userRepository, consultantRepository, clientRepository, mappingRepository,
                consultantRatingRepository, consultantRatingService, scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository, commonCodeService, passwordService, encryptionUtil,
                consultantAvailabilityService, consultationMessageService, branchService,
                notificationService, financialTransactionService, cardMerchantFeeResolutionService,
                paymentMethodSsotService, realTimeStatisticsService,
                financialTransactionRepository, amountManagementService, storedProcedureService,
                userRoleAssignmentRepository, tenantRoleRepository, userRoleQueryService,
                statusCodeHelper, userPersonalDataCacheService, scheduleListUserFieldsResolver,
                consultantStatsService, clientStatsService,
                notificationChannelPreferenceResolutionService, passwordResetService,
                noopTransactionManager, userIdGenerator, userService,
                consultantSalaryProfileRepository, scheduleService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper, batchNotificationDispatchService,
                refundAutoCancelNotificationService, userLifecycleService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("ACTIVE rem≥1 + SAME_DAY_CARD → IllegalArgumentException (생성 차단)")
    void createMapping_sameDayCard_blockedWhenActiveRemaining() {
        ConsultantClientMapping active = newExistingMapping(103L, MappingStatus.ACTIVE, 5);
        stubCreateFlow(List.of(active));
        stubSessionClient();

        ConsultantClientMappingCreateRequest dto = newRequest();
        dto.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);

        assertThatThrownBy(() -> adminService.createMapping(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_CREATE_SAME_DAY_WHILE_ACTIVE_REMAINING);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("ACTIVE rem=0 + SAME_DAY_CARD → 생성 허용 (단회기 회귀)")
    void createMapping_sameDayCard_allowedWhenActiveRemainingZero() {
        ConsultantClientMapping active = newExistingMapping(104L, MappingStatus.ACTIVE, 0);
        stubCreateFlowWithSave(List.of(active));
        stubSessionClient();

        ConsultantClientMappingCreateRequest dto = newRequest();
        dto.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);
        dto.setTotalSessions(1);

        ConsultantClientMapping created = adminService.createMapping(dto);

        assertThat(created.getPaymentTiming()).isEqualTo(PaymentTimingConstants.SAME_DAY_CARD);
        assertThat(created.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(active.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("ACTIVE rem≥1 + ADVANCE → 추가 패키지 PENDING 허용 (선납 회귀)")
    void createMapping_advance_allowedWhenActiveRemaining() {
        ConsultantClientMapping active = newExistingMapping(105L, MappingStatus.ACTIVE, 3);
        stubCreateFlowWithSave(List.of(active));
        stubSessionClient();

        ConsultantClientMappingCreateRequest dto = newRequest();
        dto.setPaymentTiming(PaymentTimingConstants.ADVANCE);

        ConsultantClientMapping created = adminService.createMapping(dto);

        assertThat(created.getPaymentTiming()).isEqualTo(PaymentTimingConstants.ADVANCE);
        assertThat(created.getNotes()).contains(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MARKER);
        assertThat(active.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(active.getRemainingSessions()).isEqualTo(3);
    }

    @Test
    @DisplayName("ACTIVE 없음 + SAME_DAY_CARD → 생성 허용")
    void createMapping_sameDayCard_allowedWhenNoActive() {
        stubCreateFlowWithSave(List.of());
        stubSessionClient();

        ConsultantClientMappingCreateRequest dto = newRequest();
        dto.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);
        dto.setTotalSessions(1);

        ConsultantClientMapping created = adminService.createMapping(dto);

        assertThat(created.getPaymentTiming()).isEqualTo(PaymentTimingConstants.SAME_DAY_CARD);
        assertThat(created.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
    }

    private void stubSessionClient() {
        Client client = new Client();
        client.setId(CLIENT_ID);
        client.setEngagementType(ClientEngagementTypeConstants.SESSION_TICKET);
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TEST_TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(client));
    }

    private ConsultantClientMapping newExistingMapping(Long id, MappingStatus status, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setStatus(status);
        mapping.setRemainingSessions(remaining);
        mapping.setUsedSessions(0);
        mapping.setTotalSessions(10);
        return mapping;
    }

    private ConsultantClientMappingCreateRequest newRequest() {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(CONSULTANT_ID);
        dto.setClientId(CLIENT_ID);
        dto.setTotalSessions(10);
        dto.setPackageName("test-package");
        dto.setPackagePrice(50_000L);
        dto.setStatus(MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name());
        return dto;
    }

    private void stubCreateFlow(List<ConsultantClientMapping> existingMappings) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setName("테스트상담사");

        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);
        client.setName("테스트내담자");

        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(client));
        when(mappingRepository.findByTenantIdAndConsultantAndClientAndStatusIn(
                eq(TEST_TENANT_ID), eq(consultant), eq(client), anyCollection()))
                .thenAnswer(inv -> {
                    Collection<?> statuses = inv.getArgument(3);
                    return existingMappings.stream().filter(m -> statuses.contains(m.getStatus())).toList();
                });
    }

    private void stubCreateFlowWithSave(List<ConsultantClientMapping> existingMappings) {
        stubCreateFlow(existingMappings);
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(999L);
            }
            return m;
        });
    }
}
