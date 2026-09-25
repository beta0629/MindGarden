package com.coresolution.core.controller;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.service.TenantPgConfigurationDecryptionService;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.core.security.TenantAccessControlService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.access.AccessDeniedException;

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

    @MockBean
    private TenantPgConfigurationDecryptionService decryptionService;

    @MockBean
    private TenantAccessControlService tenantAccessControlService;
    
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

        doNothing().when(tenantAccessControlService).validateTenantAccess(anyString());
        when(tenantAccessControlService.getCurrentUserId()).thenReturn("test-user");
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
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].configId").value(testConfigId))
                .andExpect(jsonPath("$.data[0].tenantId").value(testTenantId))
                .andExpect(jsonPath("$.data[0].pgProvider").value("TOSS"));
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
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.tenantId").value(testTenantId))
                .andExpect(jsonPath("$.data.history").isArray());
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 성공")
    @WithMockUser(roles = {"ADMIN"})
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
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.pgProvider").value("TOSS"));
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 필수 필드 누락")
    @WithMockUser(roles = {"ADMIN"})
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
    @WithMockUser(roles = {"ADMIN"})
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
                .andExpect(jsonPath("$.data.configId").value(testConfigId));
    }
    
    @Test
    @DisplayName("PG 설정 삭제 - 성공")
    @WithMockUser(roles = {"ADMIN"})
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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - 성공")
    @WithMockUser(roles = {"ADMIN"})
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
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result").value("SUCCESS"))
                .andExpect(jsonPath("$.data.message").value("연결 성공"))
                .andExpect(jsonPath("$.data.details").exists());
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - 실패")
    @WithMockUser(roles = {"ADMIN"})
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
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.result").value("FAILED"))
                .andExpect(jsonPath("$.data.message").exists());
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - PG 설정 없음")
    @WithMockUser(roles = {"ADMIN"})
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

    @Test
    @DisplayName("PG 설정 키 복호화 - ADMIN 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testDecryptKeys_Success() throws Exception {
        PgConfigurationKeysResponse keysResponse = PgConfigurationKeysResponse.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider("TOSS")
                .apiKey("decrypted-api-key")
                .secretKey("decrypted-secret-key")
                .decryptedAt(LocalDateTime.now())
                .requestedBy("test-user")
                .build();

        when(decryptionService.decryptKeys(eq(testTenantId), eq(testConfigId), eq("test-user")))
                .thenReturn(keysResponse);

        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/decrypt-keys",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.apiKey").value("decrypted-api-key"))
                .andExpect(jsonPath("$.data.secretKey").value("decrypted-secret-key"));
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH - 성공 (마스킹·configured·승인 유지)")
    @WithMockUser(roles = {"ADMIN"})
    void testPatchWebhookSecret_Success() throws Exception {
        TenantPgConfigurationResponse maskedResponse = TenantPgConfigurationResponse.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.IAMPORT)
                .pgName("포트원")
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .testMode(false)
                .settingsJson("{\"portoneChannelKey\":\"channel-key-live\"}")
                .portoneWebhookSecretConfigured(true)
                .requestedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(pgConfigurationService.patchWebhookSecret(eq(testTenantId), eq(testConfigId), eq("whsec_patch")))
                .thenReturn(maskedResponse);

        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_patch")
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/webhook-secret",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configId").value(testConfigId))
                .andExpect(jsonPath("$.data.portoneWebhookSecretConfigured").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.settingsJson").value(
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("portoneWebhookSecret"))))
                .andExpect(jsonPath("$.data.settingsJson").value(
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("whsec_patch"))));
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH - 타 테넌트 403")
    @WithMockUser(roles = {"ADMIN"})
    void testPatchWebhookSecret_OtherTenantForbidden() throws Exception {
        doThrow(new AccessDeniedException("해당 테넌트에 대한 접근 권한이 없습니다"))
                .when(tenantAccessControlService).validateTenantAccess(eq(testTenantId));

        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_patch")
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/webhook-secret",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .patchWebhookSecret(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH - CLIENT 403")
    @WithMockUser(roles = {"CLIENT"})
    void testPatchWebhookSecret_ClientForbidden() throws Exception {
        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_patch")
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/webhook-secret",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .patchWebhookSecret(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH - CONSULTANT 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void testPatchWebhookSecret_ConsultantForbidden() throws Exception {
        PgConfigurationWebhookSecretPatchRequest request = PgConfigurationWebhookSecretPatchRequest.builder()
                .webhookSecret("whsec_patch")
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/webhook-secret",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .patchWebhookSecret(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("테스트 모드 PATCH - ADMIN 성공")
    @WithMockUser(roles = {"ADMIN"})
    void testPatchTestMode_Success() throws Exception {
        when(pgConfigurationService.patchTestMode(eq(testTenantId), eq(testConfigId), eq(true)))
                .thenReturn(testResponse);

        PgConfigurationTestModePatchRequest request = PgConfigurationTestModePatchRequest.builder()
                .testMode(true)
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-mode",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configId").value(testConfigId));
    }

    @Test
    @DisplayName("테스트 모드 PATCH - CLIENT 403")
    @WithMockUser(roles = {"CLIENT"})
    void testPatchTestMode_ClientForbidden() throws Exception {
        PgConfigurationTestModePatchRequest request = PgConfigurationTestModePatchRequest.builder()
                .testMode(true)
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-mode",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .patchTestMode(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("테스트 모드 PATCH - CONSULTANT 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void testPatchTestMode_ConsultantForbidden() throws Exception {
        PgConfigurationTestModePatchRequest request = PgConfigurationTestModePatchRequest.builder()
                .testMode(true)
                .build();

        mockMvc.perform(patch("/api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-mode",
                        testTenantId, testConfigId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .patchTestMode(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("PG 설정 생성 - CLIENT 403")
    @WithMockUser(roles = {"CLIENT"})
    void testCreateConfiguration_ClientForbidden() throws Exception {
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKey("test-api-key")
                .secretKey("test-secret-key")
                .testMode(false)
                .build();

        mockMvc.perform(post("/api/v1/tenants/{tenantId}/pg-configurations", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(pgConfigurationService, never())
                .createConfiguration(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("포트원 클라이언트 설정 GET - CLIENT 허용(인증만)")
    @WithMockUser(roles = {"CLIENT"})
    void testGetActivePortOneClientConfig_ClientAllowed() throws Exception {
        PortOneClientConfigResponse clientConfig = PortOneClientConfigResponse.builder()
                .storeId("store-1")
                .channelKey("channel-key-1")
                .testMode(true)
                .build();
        when(pgConfigurationService.getActivePortOneClientConfig(testTenantId))
                .thenReturn(clientConfig);

        mockMvc.perform(get("/api/v1/tenants/{tenantId}/pg-configurations/active/portone-client-config",
                        testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Tenant-Id", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeId").value("store-1"));
    }
}

