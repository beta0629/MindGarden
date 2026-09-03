package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
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
 * {@link AdminServiceImpl#getAllClientsWithMappingInfo()} lifecycle 필터 검증.
 *
 * @author CoreSolution
 * @since 2026-07-02
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — getAllClientsWithMappingInfo lifecycle filter")
class AdminServiceImplGetAllClientsWithMappingInfoTest {

    private static final String TENANT_ID = "tenant-mapping-info-test";

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

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(mappingRepository.findAllWithDetailsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(null);
        when(scheduleListUserFieldsResolver.formatPhoneNumber(anyString()))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("DELETED_BY_ADMIN·ANONYMIZED·HARD_DELETED 내담자는 with-mapping-info 목록에서 제외")
    void getAllClientsWithMappingInfo_excludesDeletedLifecycleStates() {
        User active = buildClient(101L, "활성", LifecycleState.ACTIVE);
        User deletedByAdmin = buildClient(102L, "삭제대기", LifecycleState.DELETED_BY_ADMIN);
        User anonymized = buildClient(103L, "익명", LifecycleState.ANONYMIZED);
        User hardDeleted = buildClient(104L, "하드삭제", LifecycleState.HARD_DELETED);

        when(userRepository.findByRole(TENANT_ID, UserRole.CLIENT))
                .thenReturn(Arrays.asList(active, deletedByAdmin, anonymized, hardDeleted));

        List<Map<String, Object>> result = adminService.getAllClientsWithMappingInfo();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("id")).isEqualTo(101L);
        assertThat(result.get(0).get("lifecycleState")).isEqualTo(LifecycleState.ACTIVE.name());
    }

    @Test
    @DisplayName("with-mapping-info 매핑 집계 키 parity (mappingCount/activeMappingCount/totalRemainingSessions/paymentStatusCount)")
    void getAllClientsWithMappingInfo_mappingAggregateParity() {
        User client1 = buildClient(101L, "클라이언트1", LifecycleState.ACTIVE);
        User client2 = buildClient(102L, "클라이언트2", LifecycleState.ACTIVE);
        when(userRepository.findByRole(TENANT_ID, UserRole.CLIENT))
                .thenReturn(Arrays.asList(client1, client2));

        Consultant consultant1 = new Consultant();
        consultant1.setId(201L);
        consultant1.setTenantId(TENANT_ID);
        consultant1.setName("상담사1");
        consultant1.setIsActive(true);

        Consultant consultant2 = new Consultant();
        consultant2.setId(202L);
        consultant2.setTenantId(TENANT_ID);
        consultant2.setName("상담사2");
        consultant2.setIsActive(true);

        ConsultantClientMapping m1 = new ConsultantClientMapping();
        m1.setId(1001L);
        m1.setTenantId(TENANT_ID);
        m1.setClient(client1);
        m1.setConsultant(consultant1);
        m1.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        m1.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        m1.setRemainingSessions(5);

        ConsultantClientMapping m2 = new ConsultantClientMapping();
        m2.setId(1002L);
        m2.setTenantId(TENANT_ID);
        m2.setClient(client1);
        m2.setConsultant(consultant2);
        m2.setStatus(ConsultantClientMapping.MappingStatus.CANCELLED);
        m2.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);
        m2.setRemainingSessions(2);

        ConsultantClientMapping m3 = new ConsultantClientMapping();
        m3.setId(1003L);
        m3.setTenantId(TENANT_ID);
        m3.setClient(client2);
        m3.setConsultant(consultant1);
        m3.setStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
        m3.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        m3.setRemainingSessions(3);

        List<ConsultantClientMapping> allMappings = Arrays.asList(m1, m2, m3);
        when(mappingRepository.findAllWithDetailsByTenantId(TENANT_ID))
                .thenReturn(allMappings);

        List<Map<String, Object>> result = adminService.getAllClientsWithMappingInfo();
        assertThat(result).hasSize(2);

        for (User client : Arrays.asList(client1, client2)) {
            List<ConsultantClientMapping> mappingsForClient = allMappings.stream()
                    .filter(m -> m.getClient() != null && m.getClient().getId().equals(client.getId()))
                    .collect(java.util.stream.Collectors.toList());

            int expectedMappingCount = mappingsForClient.size();
            long expectedActiveMappingCount = mappingsForClient.stream()
                    .filter(m -> "APPROVED".equals(m.getStatus() != null ? m.getStatus().toString() : ""))
                    .count();
            int expectedTotalRemainingSessions = mappingsForClient.stream()
                    .filter(m -> "APPROVED".equals(m.getStatus() != null ? m.getStatus().toString() : ""))
                    .mapToInt(ConsultantClientMapping::getRemainingSessions)
                    .sum();
            Map<String, Long> expectedPaymentStatusCount = mappingsForClient.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            m -> m.getPaymentStatus() != null ? m.getPaymentStatus().toString() : "",
                            java.util.stream.Collectors.counting()
                    ));

            Map<String, Object> clientResult = result.stream()
                    .filter(r -> r.get("id").equals(client.getId()))
                    .findFirst()
                    .orElseThrow();

            assertThat(((Number) clientResult.get("mappingCount")).intValue())
                    .isEqualTo(expectedMappingCount);
            assertThat(((Number) clientResult.get("activeMappingCount")).longValue())
                    .isEqualTo(expectedActiveMappingCount);
            assertThat(((Number) clientResult.get("totalRemainingSessions")).intValue())
                    .isEqualTo(expectedTotalRemainingSessions);
            assertThat(clientResult.get("paymentStatusCount")).isEqualTo(expectedPaymentStatusCount);
        }
    }

    private User buildClient(Long id, String name, LifecycleState lifecycleState) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TENANT_ID);
        user.setName(name);
        user.setEmail("client-" + id + "@example.com");
        user.setRole(UserRole.CLIENT);
        user.setLifecycleState(lifecycleState);
        user.setIsActive(true);
        user.setIsDeleted(false);
        return user;
    }
}
