package com.coresolution.core.controller.ops;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TenantPgConfigurationOpsController 통합 테스트.
 *
 * <p>{@code addFilters = false} 이므로 메서드 본문의 {@code OpsPermissionUtils.requireOps()} +
 * HQ 가드가 SecurityContext / TenantContextHolder 를 본다. 센터 ADMIN/STAFF 는 403.</p>
 *
 * @author CoreSolution
 * @version 1.1.0
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
    @DisplayName("운영 포털 접근 - USER 역할 403 (requireOps fail-closed)")
    @WithMockUser(roles = {"USER"})
    void testOpsEndpoint_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
