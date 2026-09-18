package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * GET /api/v1/admin/mappings/client — order d8cefd40… PortOne 환불 SSOT JSON 증명.
 *
 * <p>.dev 매핑 272: 스냅샷 무료1회/10000/CONFIRMED → enrichment 후 paymentAmount=100000,
 * paymentStatus/effectivePaymentStatus=REFUNDED, productTitle=Welcome 패키지.</p>
 *
 * @author CoreSolution
 * @since 2026-09-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController getMappingsByClient — D8cefd40RefundedPortOneSsot")
class AdminControllerGetMappingsByClientD8cefd40RefundedPortOneSsotTest {

    private static final Long CLIENT_ID = 20L;
    private static final Long MAPPING_ID = 272L;
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

    @InjectMocks
    private AdminController controller;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("D8cefd40RefundedPortOneSsot — enrichment 본문 탑재 + ApiResponse JSON shape")
    void getMappingsByClient_d8cefd40RefundedPortOneSsot_putsEnrichmentInResponseJson()
            throws Exception {
        ConsultantClientMapping mappingEntity = ConsultantClientMapping.builder()
                .packageName("무료1회")
                .packagePrice(10_000L)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .paymentMethod("CREDIT_CARD")
                .paymentReference(ORDER_PUBLIC_ID)
                .totalSessions(1)
                .usedSessions(0)
                .remainingSessions(1)
                .build();
        mappingEntity.setId(MAPPING_ID);

        Map<String, Object> enriched = new HashMap<>();
        enriched.put("id", MAPPING_ID);
        enriched.put("packageName", "무료1회");
        enriched.put("packagePrice", 10_000L);
        enriched.put("paymentAmount", 100_000L);
        enriched.put("paymentStatus", "REFUNDED");
        enriched.put("effectivePaymentStatus", "REFUNDED");
        enriched.put("pgAmount", 100_000L);
        enriched.put("productTitle", "Welcome 패키지");
        enriched.put("paymentMethod", "CREDIT_CARD");
        enriched.put("paymentReference", ORDER_PUBLIC_ID);
        enriched.put("pgPaymentStatus", "REFUNDED");
        enriched.put("orderStatus", "REFUNDED");
        enriched.put("lineTotalMinor", 100_000L);
        enriched.put("cashDueMinor", 100_000L);

        when(adminService.getMappingsByClient(eq(CLIENT_ID))).thenReturn(List.of(mappingEntity));
        when(clientMappingListPayloadService.buildPayloads(eq(List.of(mappingEntity))))
                .thenReturn(List.of(enriched));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getMappingsByClient(CLIENT_ID);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<Map<String, Object>> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getData()).isNotNull();
        assertThat(body.getData().get("count")).isEqualTo(1);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mappings =
                (List<Map<String, Object>>) body.getData().get("mappings");
        assertThat(mappings).hasSize(1);
        assertThat(mappings.get(0).get("paymentAmount")).isEqualTo(100_000L);
        assertThat(mappings.get(0).get("paymentStatus")).isEqualTo("REFUNDED");
        assertThat(mappings.get(0).get("effectivePaymentStatus")).isEqualTo("REFUNDED");
        assertThat(mappings.get(0).get("pgAmount")).isEqualTo(100_000L);
        assertThat(mappings.get(0).get("productTitle")).isEqualTo("Welcome 패키지");
        assertThat(mappings.get(0).get("packagePrice")).isEqualTo(10_000L);

        verify(adminService).getMappingsByClient(CLIENT_ID);
        verify(clientMappingListPayloadService).buildPayloads(List.of(mappingEntity));

        String json = objectMapper.writeValueAsString(body);
        JsonNode mappingNode = objectMapper.readTree(json).path("data").path("mappings").get(0);
        assertThat(mappingNode.path("id").asLong()).isEqualTo(MAPPING_ID);
        assertThat(mappingNode.path("packageName").asText()).isEqualTo("무료1회");
        assertThat(mappingNode.path("packagePrice").asLong()).isEqualTo(10_000L);
        assertThat(mappingNode.path("paymentAmount").asLong()).isEqualTo(100_000L);
        assertThat(mappingNode.path("paymentStatus").asText()).isEqualTo("REFUNDED");
        assertThat(mappingNode.path("effectivePaymentStatus").asText()).isEqualTo("REFUNDED");
        assertThat(mappingNode.path("pgAmount").asLong()).isEqualTo(100_000L);
        assertThat(mappingNode.path("productTitle").asText()).isEqualTo("Welcome 패키지");
        assertThat(mappingNode.path("paymentMethod").asText()).isEqualTo("CREDIT_CARD");
        assertThat(mappingNode.path("paymentReference").asText()).isEqualTo(ORDER_PUBLIC_ID);
    }
}
