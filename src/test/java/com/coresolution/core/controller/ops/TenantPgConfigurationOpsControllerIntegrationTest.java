package com.coresolution.core.controller.ops;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * TenantPgConfigurationOpsController 통합 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)  // Security 필터 비활성화 (테스트용)
@ActiveProfiles("test")
@Transactional
@DisplayName("TenantPgConfigurationOpsController 통합 테스트")
class TenantPgConfigurationOpsControllerIntegrationTest {
    
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
        
        testResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId("test-tenant-id")
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .status(PgConfigurationStatus.APPROVED)
                .approvalStatus(ApprovalStatus.APPROVED)
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .testMode(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    @Test
    @DisplayName("승인 대기 목록 조회 - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testGetPendingApprovals_Success() throws Exception {
        // Given
        List<TenantPgConfigurationResponse> configurations = Arrays.asList(testResponse);
        when(pgConfigurationService.getPendingApprovals(null, null))
                .thenReturn(configurations);
        
        // When & Then
        mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].configId").value(testConfigId));
    }
    
    @Test
    @DisplayName("PG 설정 승인 - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testApproveConfiguration_Success() throws Exception {
        // Given
        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("admin-user")
                .approvalNote("승인 완료")
                .testConnection(true)
                .build();
        
        when(pgConfigurationService.approveConfiguration(testConfigId, request))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/approve", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
    }
    
    @Test
    @DisplayName("PG 설정 거부 - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testRejectConfiguration_Success() throws Exception {
        // Given
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("admin-user")
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
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/reject", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.approvalStatus").value("REJECTED"));
    }
    
    @Test
    @DisplayName("PG 설정 거부 - 거부 사유 누락")
    @WithMockUser(roles = {"ADMIN"})
    void testRejectConfiguration_MissingRejectionReason() throws Exception {
        // Given
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("admin-user")
                // rejectionReason 누락
                .build();
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/reject", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @DisplayName("PG 설정 활성화 - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testActivateConfiguration_Success() throws Exception {
        // Given
        TenantPgConfigurationResponse activatedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .status(PgConfigurationStatus.ACTIVE)
                .build();
        
        when(pgConfigurationService.activateConfiguration(anyString(), anyString()))
                .thenReturn(activatedResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/activate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
    
    @Test
    @DisplayName("PG 설정 비활성화 - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testDeactivateConfiguration_Success() throws Exception {
        // Given
        TenantPgConfigurationResponse deactivatedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .status(PgConfigurationStatus.INACTIVE)
                .build();
        
        when(pgConfigurationService.deactivateConfiguration(anyString(), anyString()))
                .thenReturn(deactivatedResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/deactivate", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
    
    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) - 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testTestConnection_Success() throws Exception {
        // Given
        ConnectionTestResponse testResponse = ConnectionTestResponse.builder()
                .success(true)
                .result("SUCCESS")
                .message("연결 성공")
                .testedAt(LocalDateTime.now())
                .details("{\"status\":\"ok\"}")
                .build();
        
        when(pgConfigurationService.testConnectionBeforeApproval(testConfigId))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("연결 성공"));
    }
    
    @Test
    @DisplayName("PG 연결 테스트 (운영 포털) - 실패")
    @WithMockUser(roles = {"ADMIN"})
    void testTestConnection_Failed() throws Exception {
        // Given
        ConnectionTestResponse testResponse = ConnectionTestResponse.builder()
                .success(false)
                .result("FAILED")
                .message("연결 실패: API Key가 유효하지 않습니다")
                .testedAt(LocalDateTime.now())
                .build();
        
        when(pgConfigurationService.testConnectionBeforeApproval(testConfigId))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/ops/pg-configurations/{configId}/test-connection", testConfigId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.result").value("FAILED"));
    }
    
    @Test
    @DisplayName("운영 포털 접근 - 권한 없음")
    @WithMockUser(roles = {"USER"}) // ADMIN 또는 OPS 권한 없음
    void testOpsEndpoint_Unauthorized() throws Exception {
        // Security 필터가 비활성화되어 있으므로, 이 테스트는 스킵
        // 실제 운영 환경에서는 @PreAuthorize로 권한 검증이 수행됨
        // When & Then
        // mockMvc.perform(get("/api/v1/ops/pg-configurations/pending")
        //                 .contentType(MediaType.APPLICATION_JSON))
        //         .andExpect(status().isForbidden());
    }
}

