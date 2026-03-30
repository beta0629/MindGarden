package com.coresolution.core.controller;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.context.TenantContextHolder;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TenantPgConfigurationController 통합 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)  // Security 필터 비활성화 (테스트용)
@ActiveProfiles("test")
@Transactional
@DisplayName("TenantPgConfigurationController 통합 테스트")
class TenantPgConfigurationControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private TenantPgConfigurationService pgConfigurationService;
    
    private String testTenantId;
    private String testConfigId;
    private TenantPgConfigurationResponse testResponse;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-id";
        testConfigId = UUID.randomUUID().toString();
        
        testResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .status(PgConfigurationStatus.PENDING)
                .approvalStatus(ApprovalStatus.PENDING)
                .testMode(false)
                .requestedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        // TenantContext 설정
        TenantContextHolder.setTenantId(testTenantId);
    }
    
    @Test
    @DisplayName("PG 설정 목록 조회 - 성공")
    @WithMockUser
    void testGetConfigurations_Success() throws Exception {
        // Given
        List<TenantPgConfigurationResponse> configurations = Arrays.asList(testResponse);
        when(pgConfigurationService.getConfigurations(testTenantId, null, null))
                .thenReturn(configurations);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/pg-configurations", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].configId").value(testConfigId))
                .andExpect(jsonPath("$[0].tenantId").value(testTenantId))
                .andExpect(jsonPath("$[0].pgProvider").value("TOSS"));
    }
    
    @Test
    @DisplayName("PG 설정 상세 조회 - 성공")
    @WithMockUser
    void testGetConfigurationDetail_Success() throws Exception {
        // Given
        TenantPgConfigurationDetailResponse detailResponse = TenantPgConfigurationDetailResponse.detailBuilder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .status(PgConfigurationStatus.PENDING)
                .approvalStatus(ApprovalStatus.PENDING)
                .history(Arrays.asList())
                .build();
        
        when(pgConfigurationService.getConfigurationDetail(testTenantId, testConfigId))
                .thenReturn(detailResponse);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/pg-configurations/{configId}", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.tenantId").value(testTenantId))
                .andExpect(jsonPath("$.history").isArray());
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 성공")
    @WithMockUser
    void testCreateConfiguration_Success() throws Exception {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKey("test-api-key")
                .secretKey("test-secret-key")
                .testMode(false)
                .build();
        
        when(pgConfigurationService.createConfiguration(eq(testTenantId), any(), any()))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.configId").value(testConfigId))
                .andExpect(jsonPath("$.pgProvider").value("TOSS"));
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 필수 필드 누락")
    @WithMockUser
    void testCreateConfiguration_MissingRequiredFields() throws Exception {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                // apiKey, secretKey 누락
                .build();
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @DisplayName("PG 설정 수정 - 성공")
    @WithMockUser
    void testUpdateConfiguration_Success() throws Exception {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠 수정")
                .apiKey("new-api-key")
                .secretKey("new-secret-key")
                .testMode(false)
                .build();
        
        when(pgConfigurationService.updateConfiguration(testTenantId, testConfigId, request))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(put("/api/v1/tenants/{tenantId}/pg-configurations/{configId}", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configId").value(testConfigId));
    }
    
    @Test
    @DisplayName("PG 설정 삭제 - 성공")
    @WithMockUser
    void testDeleteConfiguration_Success() throws Exception {
        // Given
        // 삭제는 void 반환이므로 Mockito.doNothing() 사용
        org.mockito.Mockito.doNothing()
                .when(pgConfigurationService)
                .deleteConfiguration(testTenantId, testConfigId);
        
        // When & Then
        mockMvc.perform(delete("/api/v1/tenants/{tenantId}/pg-configurations/{configId}", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isNoContent());
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - 성공")
    @WithMockUser
    void testTestConnection_Success() throws Exception {
        // Given
        ConnectionTestResponse testResponse = ConnectionTestResponse.builder()
                .success(true)
                .result("SUCCESS")
                .message("연결 성공")
                .testedAt(LocalDateTime.now())
                .details("{\"status\":\"ok\",\"provider\":\"TOSS\"}")
                .build();
        
        when(pgConfigurationService.testConnection(testTenantId, testConfigId))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-connection", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.result").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("연결 성공"))
                .andExpect(jsonPath("$.details").exists());
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - 실패")
    @WithMockUser
    void testTestConnection_Failed() throws Exception {
        // Given
        ConnectionTestResponse testResponse = ConnectionTestResponse.builder()
                .success(false)
                .result("FAILED")
                .message("연결 실패: API Key가 유효하지 않습니다")
                .testedAt(LocalDateTime.now())
                .build();
        
        when(pgConfigurationService.testConnection(testTenantId, testConfigId))
                .thenReturn(testResponse);
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-connection", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.result").value("FAILED"))
                .andExpect(jsonPath("$.message").exists());
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - PG 설정 없음")
    @WithMockUser
    void testTestConnection_NotFound() throws Exception {
        // Given
        when(pgConfigurationService.testConnection(testTenantId, testConfigId))
                .thenThrow(new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + testConfigId));
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-connection", 
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isBadRequest());
    }
}

