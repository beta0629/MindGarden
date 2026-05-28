package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.AdminDeleteBlockedException;
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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link AdminServiceImpl#deleteClient(Long, Long, String, String)} 및
 * {@link AdminServiceImpl#deleteConsultant(Long, Long, String, String)} 가
 * 비즈니스 가드 발동 시 {@link AdminDeleteBlockedException} 으로 차단되며,
 * 사유 코드·details 가 정확히 채워지는지 검증.
 *
 * <p>가드 사유 5종 매트릭스:</p>
 * <ul>
 *   <li>{@code REMAINING_SESSIONS} — 잔여 회기 있는 활성 매칭</li>
 *   <li>{@code PENDING_PAYMENT_MAPPING} — 결제 대기 매칭 (P0 사용자 보고 시나리오)</li>
 *   <li>{@code FUTURE_SCHEDULES} — BOOKED/CONFIRMED 예정 스케줄</li>
 *   <li>{@code CONSULTANT_ACTIVE_MAPPINGS} — 상담사 활성 매칭(이관 필요)</li>
 *   <li>{@code CONSULTANT_FUTURE_SCHEDULES} — 상담사 예정 스케줄</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — 어드민 삭제 가드 정형화 (AdminDeleteBlockedException)")
class AdminServiceImplDeleteBlockedExceptionTest {

    private static final String TENANT_ID = "tenant-delete-blocked-test";
    private static final Long CLIENT_ID = 7001L;
    private static final Long CONSULTANT_ID = 7002L;
    private static final Long ADMIN_ID = 999L;
    private static final String ADMIN_ROLE = UserRole.ADMIN.name();
    private static final String REASON = "운영 차단 테스트";

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
        clientUser.setName("내담자 가드 테스트");
        clientUser.setEmail("client-blocked@example.com");
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setLifecycleState(LifecycleState.ACTIVE);
        clientUser.setIsActive(true);

        consultantUser = new User();
        consultantUser.setId(CONSULTANT_ID);
        consultantUser.setTenantId(TENANT_ID);
        consultantUser.setName("상담사 가드 테스트");
        consultantUser.setEmail("consultant-blocked@example.com");
        consultantUser.setRole(UserRole.CONSULTANT);
        consultantUser.setLifecycleState(LifecycleState.ACTIVE);
        consultantUser.setIsActive(true);

        // statusCodeHelper 가 코드 그대로 fallback 반환 — 실제 코드 매핑은 본 테스트의 관심사가 아님.
        when(statusCodeHelper.getStatusCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("deleteClient: PENDING_PAYMENT 매핑 존재 시 AdminDeleteBlockedException(PENDING_PAYMENT_MAPPING) + details.pendingMappingCount")
    void deleteClient_pendingPaymentMapping_throwsAdminDeleteBlockedException() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(clientUser));
        ConsultantClientMapping pendingMapping = new ConsultantClientMapping();
        pendingMapping.setClient(clientUser);
        pendingMapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        pendingMapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);
        pendingMapping.setRemainingSessions(0);
        ConsultantClientMapping pendingMapping2 = new ConsultantClientMapping();
        pendingMapping2.setClient(clientUser);
        pendingMapping2.setStatus(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT);
        pendingMapping2.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);
        pendingMapping2.setRemainingSessions(0);
        when(mappingRepository.findByTenantId(TENANT_ID))
                .thenReturn(List.of(pendingMapping, pendingMapping2));

        assertThatThrownBy(() -> adminService.deleteClient(CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOfSatisfying(AdminDeleteBlockedException.class, ex -> {
                    assertThat(ex.getCode())
                            .isEqualTo(AdminServiceUserFacingMessages
                                    .DELETE_BLOCKED_CODE_PENDING_PAYMENT_MAPPING);
                    assertThat(ex.getMessage()).contains("결제 대기");
                    assertThat(ex.getDetails()).containsEntry("pendingMappingCount", 2);
                });

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("deleteClient: 잔여 회기 있는 활성 매칭 시 AdminDeleteBlockedException(REMAINING_SESSIONS)")
    void deleteClient_remainingSessions_throwsAdminDeleteBlockedException() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(clientUser));
        ConsultantClientMapping activeMapping = new ConsultantClientMapping();
        activeMapping.setClient(clientUser);
        activeMapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        activeMapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        activeMapping.setRemainingSessions(3);
        when(mappingRepository.findByTenantId(TENANT_ID))
                .thenReturn(List.of(activeMapping));

        assertThatThrownBy(() -> adminService.deleteClient(CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOfSatisfying(AdminDeleteBlockedException.class, ex -> {
                    assertThat(ex.getCode())
                            .isEqualTo(AdminServiceUserFacingMessages
                                    .DELETE_BLOCKED_CODE_REMAINING_SESSIONS);
                    assertThat(ex.getDetails())
                            .containsEntry("activeMappingCount", 1)
                            .containsEntry("remainingSessions", 3);
                });
    }

    @Test
    @DisplayName("deleteClient: 예정 스케줄(BOOKED) 존재 시 AdminDeleteBlockedException(FUTURE_SCHEDULES)")
    void deleteClient_futureSchedules_throwsAdminDeleteBlockedException() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID))
                .thenReturn(Optional.of(clientUser));
        when(mappingRepository.findByTenantId(TENANT_ID)).thenReturn(Collections.emptyList());
        Schedule bookedSchedule = new Schedule();
        bookedSchedule.setId(1001L);
        bookedSchedule.setStatus(ScheduleStatus.BOOKED);
        bookedSchedule.setDate(LocalDate.now().plusDays(1));
        when(scheduleRepository.findByTenantIdAndClientIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CLIENT_ID), any(LocalDate.class)))
                .thenReturn(List.of(bookedSchedule));

        assertThatThrownBy(() -> adminService.deleteClient(CLIENT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOfSatisfying(AdminDeleteBlockedException.class, ex -> {
                    assertThat(ex.getCode())
                            .isEqualTo(AdminServiceUserFacingMessages
                                    .DELETE_BLOCKED_CODE_FUTURE_SCHEDULES);
                    assertThat(ex.getDetails()).containsEntry("futureScheduleCount", 1);
                });
    }

    @Test
    @DisplayName("deleteConsultant: 활성 매칭 존재 시 AdminDeleteBlockedException(CONSULTANT_ACTIVE_MAPPINGS)")
    void deleteConsultant_activeMappings_throwsAdminDeleteBlockedException() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(consultantUser));
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        when(mappingRepository.findByConsultantIdAndStatusNot(
                eq(TENANT_ID), eq(CONSULTANT_ID),
                eq(ConsultantClientMapping.MappingStatus.TERMINATED)))
                .thenReturn(List.of(mapping, mapping));

        assertThatThrownBy(() -> adminService.deleteConsultant(
                CONSULTANT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOfSatisfying(AdminDeleteBlockedException.class, ex -> {
                    assertThat(ex.getCode())
                            .isEqualTo(AdminServiceUserFacingMessages
                                    .DELETE_BLOCKED_CODE_CONSULTANT_ACTIVE_MAPPINGS);
                    assertThat(ex.getDetails()).containsEntry("activeMappingCount", 2);
                });

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("deleteConsultant: 예정 스케줄 존재 시 AdminDeleteBlockedException(CONSULTANT_FUTURE_SCHEDULES)")
    void deleteConsultant_futureSchedules_throwsAdminDeleteBlockedException() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(consultantUser));
        when(mappingRepository.findByConsultantIdAndStatusNot(
                eq(TENANT_ID), eq(CONSULTANT_ID),
                eq(ConsultantClientMapping.MappingStatus.TERMINATED)))
                .thenReturn(Collections.emptyList());
        Schedule s = new Schedule();
        s.setId(2002L);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateGreaterThanEqual(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(List.of(s));

        assertThatThrownBy(() -> adminService.deleteConsultant(
                CONSULTANT_ID, ADMIN_ID, ADMIN_ROLE, REASON))
                .isInstanceOfSatisfying(AdminDeleteBlockedException.class, ex -> {
                    assertThat(ex.getCode())
                            .isEqualTo(AdminServiceUserFacingMessages
                                    .DELETE_BLOCKED_CODE_CONSULTANT_FUTURE_SCHEDULES);
                    assertThat(ex.getDetails()).containsEntry("futureScheduleCount", 1);
                });
    }
}
