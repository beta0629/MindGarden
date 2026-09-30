package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientMappingListPayloadService;
import com.coresolution.consultation.service.ClientPackagePaymentHistoryService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.MenuService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * GET /api/v1/admin/mappings/client — CLIENT 는 본인 매칭만 조회한다.
 *
 * <p>같은 테넌트의 다른 내담자 id는 저장소 조회 전에 거부한다.
 * 거부 예외는 {@code GlobalExceptionHandler} 가 HTTP 403 으로 응답한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminController getMappingsByClient — CLIENT 본인 매칭만")
class AdminControllerGetMappingsByClientOwnershipGuardTest {

    private static final String TENANT_HOME = "tenant-mappings-home";
    private static final String TENANT_OTHER = "tenant-mappings-other";
    private static final Long CLIENT_A = 101L;
    private static final Long CLIENT_B = 202L;
    private static final Long MAPPING_A = 1001L;
    private static final Long MAPPING_B = 2002L;
    private static final Long AMOUNT_A = 11_000L;
    private static final Long AMOUNT_B = 99_000L;

    @Mock private AdminService adminService;
    @Mock private ClientPackagePaymentHistoryService clientPackagePaymentHistoryService;
    @Mock private ClientMappingListPayloadService clientMappingListPayloadService;
    @Mock private BranchService branchService;
    @Mock private ScheduleService scheduleService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private MenuService menuService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private ErpService erpService;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private UserService userService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private PersonalDataEncryptionUtil personalDataEncryptionUtil;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private OnboardingService onboardingService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private UserRepository userRepository;
    @Mock private com.coresolution.consultation.service.ScheduleClientReminderSmsStatusService
            scheduleClientReminderSmsStatusService;
    @Mock private com.coresolution.consultation.repository.ClientRepository clientRepository;
    @Mock private com.coresolution.consultation.repository.ConsultantRepository consultantRepository;

    @InjectMocks
    private AdminController controller;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("같은 테넌트 CLIENT A가 B의 id를 요청하면 403이고 B의 결제 행을 조회하지 않는다")
    void clientRequestsOtherClientInSameTenant_deniedBeforeQuery() {
        MockHttpSession session = sessionWith(user(CLIENT_A, UserRole.CLIENT, TENANT_HOME));
        stubBothClients();

        assertThatThrownBy(() -> controller.getMappingsByClient(CLIENT_B, session))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("본인 매칭");

        verify(adminService, never()).getMappingsByClient(any());
        verify(clientMappingListPayloadService, never()).buildPayloads(any());
    }

    @Test
    @DisplayName("CLIENT A가 본인 id를 요청하면 200이고 A의 행만 반환한다")
    void clientRequestsOwnId_returnsOnlyOwnRows() {
        MockHttpSession session = sessionWith(user(CLIENT_A, UserRole.CLIENT, TENANT_HOME));
        stubBothClients();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getMappingsByClient(CLIENT_A, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> mappings = mappingsOf(response);
        assertThat(mappings).hasSize(1);
        assertThat(mappings.get(0).get("paymentAmount")).isEqualTo(AMOUNT_A);
        assertThat(mappings.get(0).get("id")).isEqualTo(MAPPING_A);
        assertThat(mappings).extracting(row -> row.get("paymentAmount")).doesNotContain(AMOUNT_B);
        verify(adminService).getMappingsByClient(CLIENT_A);
        verify(adminService, never()).getMappingsByClient(CLIENT_B);
    }

    @Test
    @DisplayName("같은 테넌트 ADMIN이 B를 조회하면 200이고 관리자 경로는 유지된다")
    void sameTenantAdminRequestsClientB_returns200() {
        MockHttpSession session = sessionWith(user(900L, UserRole.ADMIN, TENANT_HOME));
        stubBothClients();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getMappingsByClient(CLIENT_B, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> mappings = mappingsOf(response);
        assertThat(mappings).hasSize(1);
        assertThat(mappings.get(0).get("paymentAmount")).isEqualTo(AMOUNT_B);
        verify(adminService).getMappingsByClient(CLIENT_B);
    }

    @Test
    @DisplayName("같은 테넌트 STAFF가 B를 조회하면 200이다")
    void sameTenantStaffRequestsClientB_returns200() {
        MockHttpSession session = sessionWith(user(901L, UserRole.STAFF, TENANT_HOME));
        stubBothClients();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getMappingsByClient(CLIENT_B, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(mappingsOf(response).get(0).get("paymentAmount")).isEqualTo(AMOUNT_B);
        verify(adminService).getMappingsByClient(CLIENT_B);
    }

    @Test
    @DisplayName("다른 테넌트 CLIENT가 B의 id를 요청하면 403이고 B의 행을 조회하지 않는다")
    void otherTenantClientRequestsClientB_deniedBeforeQuery() {
        MockHttpSession session = sessionWith(user(CLIENT_A, UserRole.CLIENT, TENANT_OTHER));
        stubBothClients();

        assertThatThrownBy(() -> controller.getMappingsByClient(CLIENT_B, session))
                .isInstanceOf(AccessDeniedException.class);

        verify(adminService, never()).getMappingsByClient(any());
        verify(clientMappingListPayloadService, never()).buildPayloads(any());
    }

    @Test
    @DisplayName("반례: CLIENT가 clientId 없이(null) 호출하면 조회하지 않고 거부한다")
    void clientOmitsClientId_deniedBeforeQuery() {
        MockHttpSession session = sessionWith(user(CLIENT_A, UserRole.CLIENT, TENANT_HOME));

        assertThatThrownBy(() -> controller.getMappingsByClient(null, session))
                .isInstanceOf(AccessDeniedException.class);

        verify(adminService, never()).getMappingsByClient(any());
    }

    @Test
    @DisplayName("반례: 세션 사용자가 없으면 요청 clientId로 조회하지 않는다")
    void unauthenticatedCaller_deniedBeforeQuery() {
        assertThatThrownBy(() -> controller.getMappingsByClient(CLIENT_B, new MockHttpSession()))
                .isInstanceOf(AccessDeniedException.class);

        verify(adminService, never()).getMappingsByClient(any());
    }

    private void stubBothClients() {
        ConsultantClientMapping mappingA = ConsultantClientMapping.builder()
                .paymentAmount(AMOUNT_A)
                .build();
        mappingA.setId(MAPPING_A);
        ConsultantClientMapping mappingB = ConsultantClientMapping.builder()
                .paymentAmount(AMOUNT_B)
                .build();
        mappingB.setId(MAPPING_B);

        when(adminService.getMappingsByClient(CLIENT_A)).thenReturn(List.of(mappingA));
        when(adminService.getMappingsByClient(CLIENT_B)).thenReturn(List.of(mappingB));
        when(clientMappingListPayloadService.buildPayloads(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            List<ConsultantClientMapping> rows = invocation.getArgument(0);
            ConsultantClientMapping mapping = rows.get(0);
            Map<String, Object> row = new HashMap<>();
            row.put("id", mapping.getId());
            row.put("paymentAmount", mapping.getPaymentAmount());
            return List.of(row);
        });
    }

    private static MockHttpSession sessionWith(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private static User user(Long id, UserRole role, String tenantId) {
        User user = User.builder()
                .userId("uid-" + id)
                .email("user-" + id + "@example.com")
                .role(role)
                .build();
        user.setId(id);
        user.setTenantId(tenantId);
        return user;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> mappingsOf(
            ResponseEntity<ApiResponse<Map<String, Object>>> response) {
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        return (List<Map<String, Object>>) response.getBody().getData().get("mappings");
    }
}
