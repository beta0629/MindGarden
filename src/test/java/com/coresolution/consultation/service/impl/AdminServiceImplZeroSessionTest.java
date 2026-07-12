package com.coresolution.consultation.service.impl;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 0회기·커스텀 회기 매핑 생성/입금확인 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("0회기 및 커스텀 회기수 결제 시나리오 검증")
class AdminServiceImplZeroSessionTest {

    private static final String TEST_TENANT_ID = "tenant-test-zero-session-" + UUID.randomUUID();

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
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                Mockito.mock(com.coresolution.consultation.service.UserLifecycleService.class),
                Mockito.mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class));
        adminService = Mockito.spy(real);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("0회기 패키지 createMapping 시 remainingSessions가 0으로 유지되는지 검증")
    void createMapping_ZeroSession_MaintainsZeroRemainingSessions() {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);

        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 10L)).thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 20L)).thenReturn(Optional.of(client));
        when(mappingRepository.findByTenantIdAndConsultantAndClient(eq(TEST_TENANT_ID), eq(consultant), eq(client)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = ConsultantClientMappingCreateRequest.builder()
                .consultantId(10L)
                .clientId(20L)
                .totalSessions(0)
                .packageName("단순 검사(0회기)")
                .packagePrice(50000L)
                .paymentAmount(50000L)
                .status(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT.name())
                .paymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name())
                .build();

        ConsultantClientMapping result = adminService.createMapping(dto);

        assertNotNull(result);
        assertEquals(0, result.getTotalSessions());
        assertEquals(0, result.getRemainingSessions());
        assertEquals("단순 검사(0회기)", result.getPackageName());
        assertEquals(50000L, result.getPackagePrice());
    }

    @Test
    @DisplayName("0회기 패키지 confirmDeposit 시 remainingSessions가 0으로 유지되고 예외가 발생하지 않는지 검증")
    void confirmDeposit_ZeroSession_NoDivisionByZero() {
        Long mappingId = 1L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId, 0, 50000L);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-001");

        assertNotNull(result);
        assertEquals(0, result.getRemainingSessions());
        verify(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        verify(storedProcedureService).updateMappingInfo(eq(mappingId), any(), eq(50000.0), eq(0), any());
    }

    @Test
    @DisplayName("검사(0회기) + 상담(1회기) 조합 패키지(totalSessions=1) 결제 및 트랜잭션 정상 동작 검증")
    void confirmDeposit_CustomSessionCombination_WorksCorrectly() {
        Long mappingId = 2L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId, 1, 150000L);
        mapping.setPackageName("검사 + 상담(1회기)");

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-002");

        assertNotNull(result);
        assertEquals(1, result.getRemainingSessions());
        verify(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        verify(storedProcedureService).updateMappingInfo(eq(mappingId), any(), eq(150000.0), eq(1), any());
    }

    private ConsultantClientMapping buildMappingForConfirmDeposit(Long mappingId, int totalSessions, long packagePrice) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTotalSessions(totalSessions);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentAmount(packagePrice);
        mapping.setPaymentReference("PAY-REF");
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        return mapping;
    }
}
