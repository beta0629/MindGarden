package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * AdminServiceImpl#updateMapping — 동일 매핑 in-place 상담사 변경 (사이드바 Side Peek write SSOT).
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl updateMapping — 상담사 in-place 변경")
class AdminServiceImplUpdateMappingConsultantTest {

    private static final String TEST_TENANT_ID = "tenant-map-consultant-" + UUID.randomUUID();

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
                salaryTaxRateLookupService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("consultantId만 변경 — 매핑 상담사 저장, ERP·스케줄 미호출")
    void updateMapping_consultantOnly_persistsAndSkipsErpAndSchedules() {
        User oldConsultant = consultant(10L, "김상담");
        User newConsultant = consultant(11L, "이상담");
        User client = client(20L, "홍길동");
        ConsultantClientMapping mapping = activeMapping(100L, oldConsultant, client);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, 100L))
                .thenReturn(Optional.of(mapping));
        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 11L))
                .thenReturn(Optional.of(newConsultant));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TEST_TENANT_ID, 11L, 20L))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest request = ConsultantClientMappingCreateRequest.builder()
                .consultantId(11L)
                .build();

        ConsultantClientMappingResponse saved = adminService.updateMapping(100L, request, "admin");

        ArgumentCaptor<ConsultantClientMapping> captor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());

        ConsultantClientMapping persisted = captor.getValue();
        assertThat(persisted.getConsultant().getId()).isEqualTo(11L);
        assertThat(persisted.getPackageName()).isEqualTo("패키지A");
        assertThat(persisted.getRemainingSessions()).isEqualTo(4);
        assertThat(saved.getConsultantId()).isEqualTo(11L);
        assertThat(saved.getClientId()).isEqualTo(20L);
        assertThat(saved.getPackageName()).isEqualTo("패키지A");
        assertThat(saved.getRemainingSessions()).isEqualTo(4);
        verify(storedProcedureService, never())
                .updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
        verify(scheduleRepository, never()).save(any());
        verify(scheduleRepository, never()).findAll();
    }

    @Test
    @DisplayName("대상 (상담사·내담자) ACTIVE 매핑 충돌 시 거절")
    void updateMapping_consultantConflict_throws() {
        User oldConsultant = consultant(10L, "김상담");
        User newConsultant = consultant(11L, "이상담");
        User client = client(20L, "홍길동");
        ConsultantClientMapping mapping = activeMapping(100L, oldConsultant, client);
        ConsultantClientMapping other = activeMapping(101L, newConsultant, client);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, 100L))
                .thenReturn(Optional.of(mapping));
        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 11L))
                .thenReturn(Optional.of(newConsultant));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TEST_TENANT_ID, 11L, 20L))
                .thenReturn(List.of(other));

        ConsultantClientMappingCreateRequest request = ConsultantClientMappingCreateRequest.builder()
                .consultantId(11L)
                .build();

        assertThatThrownBy(() -> adminService.updateMapping(100L, request, "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(AdminServiceUserFacingMessages.MSG_MAPPING_CONSULTANT_TARGET_CONFLICT);

        ArgumentCaptor<ConsultantClientMapping> captor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository, never()).save(captor.capture());
    }

    private static User consultant(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    private static User client(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(UserRole.CLIENT);
        return u;
    }

    private static ConsultantClientMapping activeMapping(Long id, User consultant, User client) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(id);
        m.setTenantId(TEST_TENANT_ID);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStatus(MappingStatus.ACTIVE);
        m.setPackageName("패키지A");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setUsedSessions(6);
        m.setRemainingSessions(4);
        return m;
    }
}
