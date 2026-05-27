package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
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
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 옵션 B (예약 우선 매칭) 자동 종료 가드 검증.
 *
 * <p>합의서 (E1 §2 GAP): 신규 매칭 생성 시 기존 동일 consultant·client 매핑은 자동 TERMINATED 처리되지만,
 * PENDING_PAYMENT 또는 PAYMENT_CONFIRMED 상태(사후 카드 결제 대기)는 옵션 B 흐름이 진행 중이므로
 * 자동 TERMINATED 대상에서 제외되어야 한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 옵션 B 자동 종료 가드 (PENDING_PAYMENT/PAYMENT_CONFIRMED 보호)")
class AdminServiceImplCreateMappingPendingPaymentGuardTest {

    private static final String TEST_TENANT_ID = "tenant-option-b-guard-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 901L;
    private static final Long CLIENT_ID = 902L;

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
                commonCodeRepository, commonCodeService, passwordService, encryptionUtil,
                consultantAvailabilityService, consultationMessageService, branchService,
                notificationService, financialTransactionService, realTimeStatisticsService,
                financialTransactionRepository, amountManagementService, storedProcedureService,
                userRoleAssignmentRepository, tenantRoleRepository, userRoleQueryService,
                statusCodeHelper, userPersonalDataCacheService, scheduleListUserFieldsResolver,
                consultantStatsService, clientStatsService,
                notificationChannelPreferenceResolutionService, passwordResetService,
                noopTransactionManager, userIdGenerator, userService,
                consultantSalaryProfileRepository, scheduleService, professionalProviderTypeService,
                mappingSettlementNotificationHelper, batchNotificationDispatchService,
                refundAutoCancelNotificationService, userLifecycleService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PENDING_PAYMENT 기존 매핑은 자동 종료 대상에서 제외")
    void createMapping_protectsPendingPaymentMappingFromAutoTerminate() {
        ConsultantClientMapping pendingPaymentMapping = newExistingMapping(101L, MappingStatus.PENDING_PAYMENT);
        stubCreateFlow(List.of(pendingPaymentMapping));

        adminService.createMapping(newRequest());

        assertThat(pendingPaymentMapping.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(pendingPaymentMapping.getTerminatedAt()).isNull();
    }

    @Test
    @DisplayName("PAYMENT_CONFIRMED 기존 매핑도 자동 종료 대상에서 제외")
    void createMapping_protectsPaymentConfirmedMappingFromAutoTerminate() {
        ConsultantClientMapping confirmedMapping = newExistingMapping(102L, MappingStatus.PAYMENT_CONFIRMED);
        stubCreateFlow(List.of(confirmedMapping));

        adminService.createMapping(newRequest());

        assertThat(confirmedMapping.getStatus()).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
        assertThat(confirmedMapping.getTerminatedAt()).isNull();
    }

    @Test
    @DisplayName("ACTIVE 기존 매핑은 정상적으로 TERMINATED 처리 (기존 동작 회귀 방지)")
    void createMapping_terminatesActiveMappingAsBefore() {
        ConsultantClientMapping activeMapping = newExistingMapping(103L, MappingStatus.ACTIVE);
        activeMapping.setRemainingSessions(3);
        activeMapping.setUsedSessions(2);
        stubCreateFlow(List.of(activeMapping));

        adminService.createMapping(newRequest());

        assertThat(activeMapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(activeMapping.getTerminatedAt()).isNotNull();
        // 남은 회기는 0으로 흡수
        assertThat(activeMapping.getRemainingSessions()).isZero();
        assertThat(activeMapping.getUsedSessions()).isEqualTo(5);
    }

    @Test
    @DisplayName("혼합 (ACTIVE + PENDING_PAYMENT): ACTIVE만 종료되고 PENDING_PAYMENT는 보호")
    void createMapping_terminatesActiveButProtectsPendingPaymentMixed() {
        ConsultantClientMapping pendingPaymentMapping = newExistingMapping(201L, MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping activeMapping = newExistingMapping(202L, MappingStatus.ACTIVE);
        stubCreateFlow(Arrays.asList(pendingPaymentMapping, activeMapping));

        adminService.createMapping(newRequest());

        assertThat(pendingPaymentMapping.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(pendingPaymentMapping.getTerminatedAt()).isNull();
        assertThat(activeMapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(activeMapping.getTerminatedAt()).isNotNull();

        // 저장 호출 횟수: ACTIVE 1건 종료 + 신규 1건 = 최소 2회 (PENDING_PAYMENT는 skip되어 save 안 됨)
        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository, atLeast(2)).save(captor.capture());
        List<ConsultantClientMapping> savedAll = captor.getAllValues();
        assertThat(savedAll).noneMatch(m -> m == pendingPaymentMapping);
    }

    private ConsultantClientMapping newExistingMapping(Long id, MappingStatus status) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setStatus(status);
        mapping.setRemainingSessions(0);
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

        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);

        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(client));
        when(mappingRepository.findByTenantIdAndConsultantAndClient(eq(TEST_TENANT_ID), eq(consultant), eq(client)))
                .thenReturn(existingMappings);
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(999L);
            }
            return m;
        });
    }
}
