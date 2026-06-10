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

import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link AdminServiceImpl#deleteStaff(Long, Long, String, String)} 가드 + lifecycle redirect
 * 정합 검증.
 *
 * <p>가드 사양 (PR P1 — 스태프 페이지 삭제 기능 추가, 2026-06-10):
 * <ul>
 *   <li>대상 사용자 존재 + 동일 테넌트.</li>
 *   <li>대상 role 이 STAFF 또는 ADMIN 만 허용.</li>
 *   <li>자기 자신(adminUserId == id) 삭제 차단.</li>
 *   <li>대상이 ADMIN 인 경우 테넌트의 활성 ADMIN 잔여 수가 1 이하면 차단 (마지막 ADMIN 보호).</li>
 *   <li>가드 통과 시 UserLifecycleService.transitionTo(DELETED_BY_ADMIN) 단일 진입점 호출.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-10
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — deleteStaff 가드 + lifecycle redirect 검증 (P1, 2026-06-10)")
class AdminServiceImplDeleteStaffTest {

    private static final String TENANT_ID = "tenant-staff-delete-test";
    private static final Long STAFF_ID = 7001L;
    private static final Long ADMIN_TARGET_ID = 7002L;
    private static final Long ADMIN_ACTOR_ID = 999L;
    private static final String ADMIN_ROLE = UserRole.ADMIN.name();
    private static final String REASON = "운영 정리";

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

    private User staffUser;
    private User adminTargetUser;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);

        staffUser = new User();
        staffUser.setId(STAFF_ID);
        staffUser.setTenantId(TENANT_ID);
        staffUser.setName("스태프A");
        staffUser.setEmail("staff-a@example.com");
        staffUser.setRole(UserRole.STAFF);
        staffUser.setLifecycleState(LifecycleState.ACTIVE);
        staffUser.setIsActive(true);

        adminTargetUser = new User();
        adminTargetUser.setId(ADMIN_TARGET_ID);
        adminTargetUser.setTenantId(TENANT_ID);
        adminTargetUser.setName("관리자B");
        adminTargetUser.setEmail("admin-b@example.com");
        adminTargetUser.setRole(UserRole.ADMIN);
        adminTargetUser.setLifecycleState(LifecycleState.ACTIVE);
        adminTargetUser.setIsActive(true);

        when(statusCodeHelper.getStatusCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));

        when(userLifecycleService.transitionTo(anyLong(), any(LifecycleState.class),
                any(Actor.class), anyString()))
                .thenAnswer(inv -> TransitionResult.builder()
                        .userId(inv.getArgument(0))
                        .fromState(LifecycleState.ACTIVE)
                        .toState(inv.getArgument(1))
                        .auditLogId(9001L)
                        .build());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("STAFF 삭제: 가드 통과 후 UserLifecycleService.transitionTo(DELETED_BY_ADMIN) 호출")
    void deleteStaff_staffRole_redirectsToLifecycleService() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, STAFF_ID))
                .thenReturn(Optional.of(staffUser));

        adminService.deleteStaff(STAFF_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON);

        ArgumentCaptor<Actor> actorCaptor = ArgumentCaptor.forClass(Actor.class);
        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(userLifecycleService, times(1)).transitionTo(
                eq(STAFF_ID), eq(LifecycleState.DELETED_BY_ADMIN),
                actorCaptor.capture(), reasonCaptor.capture());
        assertThat(actorCaptor.getValue().getActorUserId()).isEqualTo(ADMIN_ACTOR_ID);
        assertThat(actorCaptor.getValue().getActorRole()).isEqualTo(ADMIN_ROLE);
        assertThat(reasonCaptor.getValue()).isEqualTo(REASON);
    }

    @Test
    @DisplayName("ADMIN 삭제: 활성 ADMIN 2명 이상이면 lifecycle 호출")
    void deleteStaff_adminRole_withMultipleActiveAdmins_redirectsToLifecycleService() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, ADMIN_TARGET_ID))
                .thenReturn(Optional.of(adminTargetUser));
        when(userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(TENANT_ID, UserRole.ADMIN))
                .thenReturn(2L);

        adminService.deleteStaff(ADMIN_TARGET_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON);

        verify(userLifecycleService, times(1)).transitionTo(
                eq(ADMIN_TARGET_ID), eq(LifecycleState.DELETED_BY_ADMIN),
                any(Actor.class), eq(REASON));
    }

    @Test
    @DisplayName("자기 자신 삭제 차단: lifecycle 호출 없음")
    void deleteStaff_self_isBlocked() {
        assertThatThrownBy(() -> adminService.deleteStaff(
                ADMIN_ACTOR_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("STAFF/ADMIN 이 아닌 사용자(예: CONSULTANT) 삭제 차단: lifecycle 호출 없음")
    void deleteStaff_nonStaffRole_isBlocked() {
        User consultant = new User();
        consultant.setId(STAFF_ID);
        consultant.setTenantId(TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setIsActive(true);
        when(userRepository.findByTenantIdAndId(TENANT_ID, STAFF_ID))
                .thenReturn(Optional.of(consultant));

        assertThatThrownBy(() -> adminService.deleteStaff(
                STAFF_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(RuntimeException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("마지막 활성 ADMIN 삭제 차단: 활성 ADMIN 1명 이하면 lifecycle 호출 없음")
    void deleteStaff_adminRole_lastActiveAdmin_isBlocked() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, ADMIN_TARGET_ID))
                .thenReturn(Optional.of(adminTargetUser));
        when(userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(TENANT_ID, UserRole.ADMIN))
                .thenReturn(1L);

        assertThatThrownBy(() -> adminService.deleteStaff(
                ADMIN_TARGET_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(IllegalStateException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("대상 사용자 미존재: RuntimeException, lifecycle 호출 없음")
    void deleteStaff_userNotFound_throws() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, STAFF_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteStaff(
                STAFF_ID, ADMIN_ACTOR_ID, ADMIN_ROLE, REASON))
                .isInstanceOf(RuntimeException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }
}
