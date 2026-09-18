package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.StatusCodeHelper;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * GET /api/v1/admin/mappings/pending-deposit — PortOne SSOT·환불 제외.
 *
 * <p>d8cefd40 계열: 매핑 스냅샷 CONFIRMED/10000 + enrichment REFUNDED/100000 → 대기 목록 제외.
 * 실대기 건 pgAmount=100000 → 응답 금액·필드 유지.</p>
 *
 * @author CoreSolution
 * @since 2026-09-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController getPendingDepositMappings — PortOne SSOT")
class AdminControllerGetPendingDepositMappingsSsotTest {

    private static final Long REFUNDED_MAPPING_ID = 272L;
    private static final Long PENDING_MAPPING_ID = 280L;
    private static final String ORDER_PUBLIC_ID = "d8cefd40-e275-4aca-8eb8-3019d93d68fb";

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
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController controller;

    private MockedStatic<SessionUtils> sessionUtilsStatic;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = org.mockito.Mockito.mockStatic(SessionUtils.class);
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("REFUNDED enrichment 행 제외 + 대기 건 pgAmount 100000 유지")
    void pendingDeposit_excludesRefunded_keepsPortOneAmount() {
        ConsultantClientMapping refundedEntity = ConsultantClientMapping.builder()
                .packageName("무료1회")
                .packagePrice(10_000L)
                .paymentAmount(10_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        refundedEntity.setId(REFUNDED_MAPPING_ID);

        ConsultantClientMapping pendingEntity = ConsultantClientMapping.builder()
                .packageName("대기패키지")
                .packagePrice(10_000L)
                .paymentAmount(10_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.PENDING)
                .paymentReference("pending-order-ssot-1")
                .build();
        pendingEntity.setId(PENDING_MAPPING_ID);

        Map<String, Object> refundedPayload = new HashMap<>();
        refundedPayload.put("id", REFUNDED_MAPPING_ID);
        refundedPayload.put("packageName", "무료1회");
        refundedPayload.put("packagePrice", 10_000L);
        refundedPayload.put("paymentAmount", 100_000L);
        refundedPayload.put("paymentStatus", "REFUNDED");
        refundedPayload.put("effectivePaymentStatus", "REFUNDED");
        refundedPayload.put("pgAmount", 100_000L);
        refundedPayload.put("productTitle", "Welcome 패키지");
        refundedPayload.put("orderStatus", "REFUNDED");
        refundedPayload.put("pgPaymentStatus", "REFUNDED");

        Map<String, Object> pendingPayload = new HashMap<>();
        pendingPayload.put("id", PENDING_MAPPING_ID);
        pendingPayload.put("packageName", "대기패키지");
        pendingPayload.put("packagePrice", 10_000L);
        pendingPayload.put("paymentAmount", 100_000L);
        pendingPayload.put("paymentStatus", "PENDING");
        pendingPayload.put("effectivePaymentStatus", "PENDING");
        pendingPayload.put("pgAmount", 100_000L);
        pendingPayload.put("productTitle", "Welcome 패키지");
        pendingPayload.put("orderStatus", "PAID");
        pendingPayload.put("pgPaymentStatus", "APPROVED");

        List<ConsultantClientMapping> entities = List.of(refundedEntity, pendingEntity);
        when(adminService.getPendingDepositMappings()).thenReturn(entities);
        when(clientMappingListPayloadService.buildPayloads(eq(entities)))
                .thenReturn(List.of(refundedPayload, pendingPayload));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getPendingDepositMappings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<Map<String, Object>> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getData()).isNotNull();
        assertThat(body.getData().get("count")).isEqualTo(1);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mappings =
                (List<Map<String, Object>>) body.getData().get("mappings");
        assertThat(mappings).hasSize(1);
        assertThat(mappings.get(0).get("id")).isEqualTo(PENDING_MAPPING_ID);
        assertThat(mappings.get(0).get("pgAmount")).isEqualTo(100_000L);
        assertThat(mappings.get(0).get("paymentAmount")).isEqualTo(100_000L);
        assertThat(mappings.get(0).get("effectivePaymentStatus")).isEqualTo("PENDING");
        assertThat(mappings.get(0).get("productTitle")).isEqualTo("Welcome 패키지");
        assertThat(mappings.get(0).get("clientName")).isEqualTo("알 수 없음");
        assertThat(mappings.get(0).get("consultantName")).isEqualTo("알 수 없음");

        verify(clientMappingListPayloadService).buildPayloads(entities);
    }
}
