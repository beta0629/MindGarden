package com.coresolution.core.controller.ops;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationDecryptionService;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TenantPgConfigurationOpsController 통합 테스트.
 *
 * <p>{@code addFilters = false} 이므로 메서드 본문의 {@code OpsPermissionUtils.requireOps()} +
 * HQ 가드가 SecurityContext / TenantContextHolder 를 본다. 센터 ADMIN/STAFF 는 403.
 * OPS + tenant 미설정(HQ JWT)은 200.</p>
 *
 * @author CoreSolution
 * @version 1.2.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("TenantPgConfigurationOpsController 통합 테스트")
class TenantPgConfigurationOpsControllerIntegrationTest {

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantPgConfigurationService pgConfigurationService;

    @MockBean
    private TenantPgConfigurationDecryptionService decryptionService;

    private String testConfigId;
    private TenantPgConfigurationResponse testResponse;

    @BeforeEach
    void setUp() {
        testConfigId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(HQ_TENANT_ID);

        testResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .status(PgConfigurationStatus.APPROVED)
                .approvalStatus(ApprovalStatus.APPROVED)
                .approvedBy("ops-user")
                .approvedAt(LocalDateTime.now())
                .testMode(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PG 설정 목록 조회 - OPS+HQ 성공 (tenantId 필터, ACTIVE 포함)")
    @WithMockUser(roles = {"OPS"})
    void testListConfigurations_WithTenantId_Success() throws Exception {
        TenantPgConfigurationResponse active = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .testMode(true)
                .build();
        when(pgConfigurationService.listConfigurationsForOps(eq("center-tenant-id")))
                .thenReturn(List.of(active));

        mockMvc.perform(get("/api/v1/ops/pg-configurations")
                        .param("tenantId", "center-tenant-id")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].configId").value(testConfigId))
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.data[0].testMode").value(true));
    }

    @Test
    @DisplayName("PG 설정 목록 조회 - OPS+HQ 성공 (tenantId 없음 = 전체)")
    @WithMockUser(roles = {"OPS"})
    void testListConfigurations_All_Success() throws Exception {
        when(pgConfigurationService.listConfigurationsForOps(isNull()))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/ops/pg-configurations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].configId").value(testConfigId));
    }

    @Test
    @DisplayName("PG 설정 목록 조회 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testListConfigurations_AdminForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/ops/pg-configurations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("승인 대기 목록 조회 - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testGetPendingApprovals_Success() throws Exception {
        List<TenantPgConfigurationResponse> configurations = Arrays.asList(testResponse);
        when(pgConfigurationService.getPendingApprovals(null, null))
                .thenReturn(configurations);

        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].configId").value(testConfigId));
    }

    @Test
    @DisplayName("승인 대기 목록 — hasPendingEdit·pendingEditDiff 필드 포함")
    @WithMockUser(roles = {"OPS"})
    void testGetPendingApprovals_IncludesPendingEditDiff() throws Exception {
        TenantPgPendingEditDiff diff = TenantPgPendingEditDiff.builder()
                .current(TenantPgPendingEditValues.builder()
                        .provider("TOSS")
                        .storeId("****ive")
                        .merchantId("****ant")
                        .channelKeyMasked("****ABCD")
                        .build())
                .pending(TenantPgPendingEditValues.builder()
                        .provider("TOSS")
                        .storeId("****ing")
                        .merchantId("****new")
                        .channelKeyMasked("****WXYZ")
                        .build())
                .apiKeyChanged(true)
                .secretKeyChanged(false)
                .build();
        TenantPgConfigurationResponse pendingItem = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .pgProvider(PgProvider.TOSS)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .hasPendingEdit(true)
                .pendingRequestedAt(LocalDateTime.now())
                .pendingEditDiff(diff)
                .build();
        when(pgConfigurationService.getPendingApprovals(null, null))
                .thenReturn(List.of(pendingItem));

        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].hasPendingEdit").value(true))
                .andExpect(jsonPath("$.data[0].pendingEditDiff.apiKeyChanged").value(true))
                .andExpect(jsonPath("$.data[0].pendingEditDiff.secretKeyChanged").value(false))
                .andExpect(jsonPath("$.data[0].pendingEditDiff.current.channelKeyMasked")
                        .value("****ABCD"))
                .andExpect(jsonPath("$.data[0].pendingEditDiff.pending.channelKeyMasked")
                        .value("****WXYZ"));
    }

    @Test
    @DisplayName("승인 대기 목록 조회 - OPS+tenant 미설정(HQ JWT) 200")
    @WithMockUser(roles = {"OPS"})
    void testGetPendingApprovals_OpsWithoutTenantId_Success() throws Exception {
        TenantContextHolder.clear();

        when(pgConfigurationService.getPendingApprovals(null, null))
                .thenReturn(List.of());

        try {
            mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        } finally {
            TenantContextHolder.setTenantId(HQ_TENANT_ID);
        }
    }

    @Test
    @DisplayName("승인 대기 목록 조회 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testGetPendingApprovals_AdminForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("승인 대기 목록 조회 - STAFF 403")
    @WithMockUser(roles = {"STAFF"})
    void testGetPendingApprovals_StaffForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("승인 대기 목록 조회 - OPS+외부 테넌트 403 (HQ 가드)")
    @WithMockUser(roles = {"OPS"})
    void testGetPendingApprovals_ExternalTenantForbidden() throws Exception {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);

        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 설정 승인 - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testApproveConfiguration_Success() throws Exception {
        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("승인 완료")
                .testConnection(true)
                .build();

        when(pgConfigurationService.approveConfiguration(testConfigId, request))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/approve", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));
    }

    @Test
    @DisplayName("PG 설정 승인 — 연결테스트 실패 시 4xx, 서비스 예외 전파")
    @WithMockUser(roles = {"OPS"})
    void testApproveConfiguration_ConnectionTestFailed_ReturnsBadRequest() throws Exception {
        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(true)
                .build();

        when(pgConfigurationService.approveConfiguration(eq(testConfigId), any(PgConfigurationApproveRequest.class)))
                .thenThrow(new IllegalStateException(
                        "PG 연결 테스트 실패로 승인을 중단했습니다: API Key 유효하지 않음"));

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/approve", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PG 설정 승인 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testApproveConfiguration_AdminForbidden() throws Exception {
        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("admin-user")
                .approvalNote("승인 시도")
                .testConnection(false)
                .build();

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/approve", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 설정 거부 - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testRejectConfiguration_Success() throws Exception {
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("ops-user")
                .rejectionReason("키 검증 실패로 인한 거부")
                .build();

        TenantPgConfigurationResponse rejectedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .approvalStatus(ApprovalStatus.REJECTED)
                .status(PgConfigurationStatus.REJECTED)
                .rejectionReason("키 검증 실패로 인한 거부")
                .build();

        when(pgConfigurationService.rejectConfiguration(testConfigId, request))
                .thenReturn(rejectedResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/reject", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));
    }

    @Test
    @DisplayName("PG 설정 거부 - 거부 사유 누락")
    @WithMockUser(roles = {"OPS"})
    void testRejectConfiguration_MissingRejectionReason() throws Exception {
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("ops-user")
                .build();

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/reject", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PG 설정 거부 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testRejectConfiguration_AdminForbidden() throws Exception {
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("admin-user")
                .rejectionReason("거부 시도")
                .build();

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/reject", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 설정 활성화 - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testActivateConfiguration_Success() throws Exception {
        TenantPgConfigurationResponse activatedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .status(PgConfigurationStatus.ACTIVE)
                .build();

        when(pgConfigurationService.activateConfiguration(anyString(), anyString()))
                .thenReturn(activatedResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/activate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("PG 설정 활성화 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testActivateConfiguration_AdminForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/activate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 설정 비활성화 - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testDeactivateConfiguration_Success() throws Exception {
        TenantPgConfigurationResponse deactivatedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .status(PgConfigurationStatus.INACTIVE)
                .build();

        when(pgConfigurationService.deactivateConfiguration(anyString(), anyString()))
                .thenReturn(deactivatedResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/deactivate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
    }

    @Test
    @DisplayName("PG 설정 비활성화 - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testDeactivateConfiguration_AdminForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/deactivate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testTestConnection_Success() throws Exception {
        ConnectionTestResponse connectionResponse = ConnectionTestResponse.builder()
                .success(true)
                .result("SUCCESS")
                .message("연결 성공")
                .testedAt(LocalDateTime.now())
                .details("{\"status\":\"ok\"}")
                .build();

        when(pgConfigurationService.testConnectionBeforeApproval(testConfigId))
                .thenReturn(connectionResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result").value("SUCCESS"))
                .andExpect(jsonPath("$.data.message").value("연결 성공"));
    }

    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) — testConnectionBeforeApproval 호출(pending 경로 포함)")
    @WithMockUser(roles = {"OPS"})
    void testTestConnection_InvokesBeforeApprovalService() throws Exception {
        ConnectionTestResponse connectionResponse = ConnectionTestResponse.builder()
                .success(true)
                .result("SUCCESS")
                .message("pending 자격 증명 테스트 성공")
                .testedAt(LocalDateTime.now())
                .build();

        when(pgConfigurationService.testConnectionBeforeApproval(testConfigId))
                .thenReturn(connectionResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value("pending 자격 증명 테스트 성공"));

        org.mockito.Mockito.verify(pgConfigurationService)
                .testConnectionBeforeApproval(testConfigId);
    }

    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testTestConnection_AdminForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) - 실패 결과도 OPS+HQ 는 200")
    @WithMockUser(roles = {"OPS"})
    void testTestConnection_Failed() throws Exception {
        ConnectionTestResponse connectionResponse = ConnectionTestResponse.builder()
                .success(false)
                .result("FAILED")
                .message("연결 실패: API Key가 유효하지 않습니다")
                .testedAt(LocalDateTime.now())
                .build();

        when(pgConfigurationService.testConnectionBeforeApproval(testConfigId))
                .thenReturn(connectionResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.result").value("FAILED"));
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH (운영 포털) - OPS+HQ 성공, 평문 미응답")
    @WithMockUser(roles = {"OPS"})
    void testPatchWebhookSecret_Success() throws Exception {
        TenantPgConfigurationDetailResponse detail = new TenantPgConfigurationDetailResponse();
        detail.setConfigId(testConfigId);
        detail.setTenantId("center-tenant-id");
        detail.setPortoneWebhookSecretConfigured(false);

        TenantPgConfigurationResponse patched = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .portoneWebhookSecretConfigured(true)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(pgConfigurationService.getConfigurationDetail(isNull(), eq(testConfigId)))
                .thenReturn(detail);
        when(pgConfigurationService.patchWebhookSecret(
                eq("center-tenant-id"), eq(testConfigId), eq("whsec_ops")))
                .thenReturn(patched);

        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_ops")
                .build();

        mockMvc.perform(patch("/api/v1/ops/pg-configurations/{configId}/webhook-secret", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.portoneWebhookSecretConfigured").value(true))
                .andExpect(content().string(
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("whsec_ops"))));
    }

    @Test
    @DisplayName("테스트 모드 PATCH (운영 포털) - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testPatchTestMode_Success() throws Exception {
        TenantPgConfigurationDetailResponse detail = new TenantPgConfigurationDetailResponse();
        detail.setConfigId(testConfigId);
        detail.setTenantId("center-tenant-id");

        TenantPgConfigurationResponse patched = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .testMode(false)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(pgConfigurationService.getConfigurationDetail(isNull(), eq(testConfigId)))
                .thenReturn(detail);
        when(pgConfigurationService.patchTestMode(eq("center-tenant-id"), eq(testConfigId), eq(false)))
                .thenReturn(patched);

        PgConfigurationTestModePatchRequest request = PgConfigurationTestModePatchRequest.builder()
                .testMode(false)
                .build();

        mockMvc.perform(patch("/api/v1/ops/pg-configurations/{configId}/test-mode", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.testMode").value(false));
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH (운영 포털) - 센터 ADMIN 403")
    @WithMockUser(roles = {"ADMIN"})
    void testPatchWebhookSecret_AdminForbidden() throws Exception {
        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_ops")
                .build();

        mockMvc.perform(patch("/api/v1/ops/pg-configurations/{configId}/webhook-secret", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PG 설정 키 복호화 (운영 포털) - OPS+HQ 성공")
    @WithMockUser(roles = {"OPS"})
    void testDecryptKeys_Success() throws Exception {
        PgConfigurationKeysResponse keysResponse = PgConfigurationKeysResponse.builder()
                .configId(testConfigId)
                .tenantId("center-tenant-id")
                .pgProvider("TOSS")
                .apiKey("ops-decrypted-api-key")
                .secretKey("ops-decrypted-secret-key")
                .decryptedAt(LocalDateTime.now())
                .requestedBy("user")
                .build();

        when(decryptionService.decryptKeysForOps(eq(testConfigId), anyString()))
                .thenReturn(keysResponse);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/decrypt-keys", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.apiKey").value("ops-decrypted-api-key"));
    }

    @Test
    @DisplayName("PG 설정 키 복호화 (운영 포털) - OPS+외부 테넌트 403 (HQ 가드)")
    @WithMockUser(roles = {"OPS"})
    void testDecryptKeys_ExternalTenantForbidden() throws Exception {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);

        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/decrypt-keys", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("운영 포털 접근 - USER 역할 403 (requireOps fail-closed)")
    @WithMockUser(roles = {"USER"})
    void testOpsEndpoint_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
