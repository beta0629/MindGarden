package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
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
import com.coresolution.consultation.service.impl.NotificationChannelPreferenceResolutionService;
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
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
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
import org.mockito.InOrder;
import org.mockito.Mockito;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link AdminServiceImpl#deleteClient(Long, Long, String, String)} 및
 * {@link AdminServiceImpl#deleteConsultant(Long, Long, String, String)} 가
 * Phase 2-β Q5 정책에 따라 {@link UserLifecycleService} 단일 진입점으로 redirect 되는지 검증.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — deleteClient/deleteConsultant redirect 검증 (Phase 2-β Q5)")
class AdminServiceImplDeleteRedirectTest {

    private static final String TENANT_ID = "tenant-redirect-test";
    private static final Long CLIENT_ID = 5001L;
    private static final Long CONSULTANT_ID = 5002L;
    private static final Long ADMIN_ID = 999L;
    private static final String ADMIN_ROLE = UserRole.ADMIN.name();
    private static final String REASON = "운영 차단";

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
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User clientUser;
    private User consultantUser;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);

        clientUser = new User();
        clientUser.setId(CLIENT_ID);
        clientUser.setTenantId(TENANT_ID);
        clientUser.setName("내담자A");
        clientUser.setEmail("client-a@example.com");
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setLifecycleState(LifecycleState.ACTIVE);
        clientUser.setIsActive(true);

        consultantUser = new User();
        consultantUser.setId(CONSULTANT_ID);
        consultantUser.setTenantId(TENANT_ID);
        consultantUser.setName("상담사B");
        consultantUser.setEmail("consultant-b@example.com");
        consultantUser.setRole(UserRole.CONSULTANT);
        consultantUser.setLifecycleState(LifecycleState.ACTIVE);
        consultantUser.setIsActive(true);

        // 공통: status code helper 가 호출되어도 statusName 그대로 fallback 반환되도록 stub.
        when(statusCodeHelper.getStatusCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));

        when(userLifecycleService.transitionTo(anyLong(), any(LifecycleState.class),
                any(Actor.class), anyString()))
                .thenAnswer(inv -> TransitionResult.builder()
                        .userId(inv.getArgument(0))
                        .fromState(LifecycleState.ACTIVE)
                        .toState(inv.getArgument(1))
                        .auditLogId(8001L)
                        .build());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("deleteClient: SUSPENDED 내담자 — ACTIVE 브릿지 후 DELETED_BY_ADMIN 전이")
    void deleteClient_suspendedClient_bridgesToActiveThenDeletes() {
        clientUser.setLifecycleState(LifecycleState.SUSPENDED);
        clientUser.setIsActive(false);

        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(clientUser));
        when(mappingRepository.findByTenantId(TENANT_ID)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        adminService.deleteClient(CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON);

        InOrder inOrder = Mockito.inOrder(userLifecycleService);
        inOrder.verify(userLifecycleService).transitionTo(
                eq(CLIENT_ID), eq(LifecycleState.ACTIVE),
                any(Actor.class), eq("ADMIN_DELETE_CLIENT_LIFECYCLE_BRIDGE"));
        inOrder.verify(userLifecycleService).transitionTo(
                eq(CLIENT_ID), eq(LifecycleState.DELETED_BY_ADMIN),
                any(Actor.class), eq(REASON));

        verify(clientStatsService).evictTenantClientsWithStatsListCache(TENANT_ID);
        verify(clientStatsService).evictClientStatsCache(TENANT_ID, CLIENT_ID);
    }

    @Test
    @DisplayName("deleteClient: 가드 통과 후 UserLifecycleService.transitionTo(DELETED_BY_ADMIN) 호출")
    void deleteClient_redirectsToLifecycleService() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(clientUser));
        when(mappingRepository.findByTenantId(TENANT_ID)).thenReturn(Collections.emptyList());
        when(scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        adminService.deleteClient(CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON);

        ArgumentCaptor<Actor> actorCaptor = ArgumentCaptor.forClass(Actor.class);
        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(userLifecycleService, times(1)).transitionTo(
                eq(CLIENT_ID), eq(LifecycleState.DELETED_BY_ADMIN),
                actorCaptor.capture(), reasonCaptor.capture());
        assertThat(actorCaptor.getValue().getActorUserId()).isEqualTo(ADMIN_ID);
        assertThat(actorCaptor.getValue().getActorRole()).isEqualTo(ADMIN_ROLE);
        assertThat(reasonCaptor.getValue()).isEqualTo(REASON);

        // 캐시 evict 도 호출되는지 보장
        verify(clientStatsService).evictTenantClientsWithStatsListCache(TENANT_ID);
        verify(clientStatsService).evictClientStatsCache(TENANT_ID, CLIENT_ID);
    }

    @Test
    @DisplayName("deleteConsultant: 활성 매핑 없으면 UserLifecycleService.transitionTo(DELETED_BY_ADMIN) 호출")
    void deleteConsultant_redirectsToLifecycleService() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(consultantUser));
        when(mappingRepository.findByConsultantIdAndStatusNot(
                eq(TENANT_ID), eq(CONSULTANT_ID),
                eq(ConsultantClientMapping.MappingStatus.TERMINATED)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        adminService.deleteConsultant(CONSULTANT_ID, ADMIN_ID, ADMIN_ROLE, REASON);

        verify(userLifecycleService, times(1)).transitionTo(
                eq(CONSULTANT_ID), eq(LifecycleState.DELETED_BY_ADMIN),
                any(Actor.class), eq(REASON));
        // 직접 setIsActive(false)/save 호출은 더 이상 없어야 한다
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("deleteConsultant: 활성 매핑이 있으면 lifecycle 호출 없이 예외 — redirect 가드 정합")
    void deleteConsultant_activeMapping_doesNotRedirect() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(consultantUser));
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        when(mappingRepository.findByConsultantIdAndStatusNot(
                eq(TENANT_ID), eq(CONSULTANT_ID),
                eq(ConsultantClientMapping.MappingStatus.TERMINATED)))
                .thenReturn(List.of(mapping));

        assertThatThrownBy(() -> adminService.deleteConsultant(
                CONSULTANT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(RuntimeException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("deleteClient: CLIENT 가 아닌 사용자(상담사) 거부 — lifecycle 호출 없음")
    void deleteClient_nonClient_doesNotRedirect() {
        // consultant 객체를 client 조회 결과로 반환 (역할 ≠ CLIENT)
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(consultantUser));

        assertThatThrownBy(() -> adminService.deleteClient(
                CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(RuntimeException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }
}
