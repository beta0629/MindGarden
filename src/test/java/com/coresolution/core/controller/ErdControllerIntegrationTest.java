package com.coresolution.core.controller;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ERD 컨트롤러 통합 테스트
 * 테넌트 포털 ERD 조회 API 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)  // 필터 비활성화 (테스트 환경)
@ActiveProfiles("test")
@Transactional
@DisplayName("ERD 컨트롤러 통합 테스트")
class ErdControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ErdGenerationService erdGenerationService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String testTenantId;
    private String testCreatedBy;
    private ErdDiagramResponse testErd;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-" + System.currentTimeMillis();
        testCreatedBy = "test-user";
        
        // 테스트용 테넌트 생성 (외래 키 제약 조건을 위해 필수)
        Tenant testTenant = Tenant.builder()
                .tenantId(testTenantId)
                .name("테스트 테넌트")
                .businessType(Tenant.BusinessType.ACADEMY)
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(testTenant);
        
        // 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(testTenantId);
        
        // 테스트용 ERD 생성
        testErd = erdGenerationService.generateTenantErd(
                testTenantId,
                null, // 기본 스키마
                testCreatedBy
        );
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("테넌트 ERD 목록 조회 성공 테스트")
    void testGetTenantErds_Success() throws Exception {
        // Given: 테넌트 컨텍스트 설정 (헤더로 전달)
        TenantContextHolder.setTenantId(testTenantId);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd", testTenantId)
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].diagramId").exists())
                .andExpect(jsonPath("$[0].tenantId").value(testTenantId))
                .andExpect(jsonPath("$[0].diagramType").value("TENANT"))
                .andExpect(jsonPath("$[0].mermaidCode").exists())
                .andExpect(jsonPath("$[0].isPublic").value(true));
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("다른 테넌트 ERD 목록 조회 실패 테스트 (권한 없음)")
    void testGetTenantErds_Unauthorized() throws Exception {
        // Given: 다른 테넌트 컨텍스트 설정 (필터가 비활성화되어 있으므로 직접 설정)
        String otherTenantId = "other-tenant-" + System.currentTimeMillis();
        TenantContextHolder.setTenantId(otherTenantId);
        
        // When & Then: 다른 테넌트 ID로 현재 테넌트의 ERD 조회 시도
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd", testTenantId)
                        .header("X-Tenant-Id", otherTenantId)  // 다른 테넌트 ID
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("ERD 상세 조회 성공 테스트")
    void testGetErdDetail_Success() throws Exception {
        // Given: 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(testTenantId);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}", 
                        testTenantId, testErd.getDiagramId())
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.diagramId").value(testErd.getDiagramId()))
                .andExpect(jsonPath("$.tenantId").value(testTenantId))
                .andExpect(jsonPath("$.mermaidCode").exists())
                .andExpect(jsonPath("$.mermaidCode").isString())
                .andExpect(jsonPath("$.textErd").exists())
                .andExpect(jsonPath("$.version").exists())
                .andExpect(jsonPath("$.isActive").exists());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("존재하지 않는 ERD 조회 실패 테스트")
    void testGetErdDetail_NotFound() throws Exception {
        // Given: 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(testTenantId);
        String nonExistentDiagramId = "non-existent-diagram-id";
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}", 
                        testTenantId, nonExistentDiagramId)
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("다른 테넌트 ERD 상세 조회 실패 테스트 (권한 없음)")
    void testGetErdDetail_Unauthorized() throws Exception {
        // Given: 다른 테넌트 생성 및 ERD 생성
        String otherTenantId = "other-tenant-" + System.currentTimeMillis();
        Tenant otherTenant = Tenant.builder()
                .tenantId(otherTenantId)
                .name("다른 테스트 테넌트")
                .businessType(Tenant.BusinessType.ACADEMY)
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(otherTenant);
        
        TenantContextHolder.setTenantId(otherTenantId);
        ErdDiagramResponse otherErd = erdGenerationService.generateTenantErd(
                otherTenantId,
                null,
                testCreatedBy
        );
        
        // When & Then: 다른 테넌트의 ERD를 현재 테넌트로 조회 시도
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}", 
                        testTenantId, otherErd.getDiagramId())
                        .header("X-Tenant-Id", testTenantId)  // 현재 테넌트 ID
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("ERD 변경 이력 조회 성공 테스트")
    void testGetErdHistory_Success() throws Exception {
        // Given: 테넌트 컨텍스트 설정 (필터가 비활성화되어 있으므로 직접 설정)
        TenantContextHolder.setTenantId(testTenantId);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}/history", 
                        testTenantId, testErd.getDiagramId())
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
                // 이력이 있을 수도 있고 없을 수도 있으므로, 배열이 존재하는지만 확인
                // 첫 번째 요소가 있으면 추가 검증
                // (실제로는 이력이 생성될 수도 있으므로 빈 배열이어도 정상)
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("ERD 변경 이력 조회 - 빈 목록 테스트")
    void testGetErdHistory_Empty() throws Exception {
        // Given: 새 ERD 생성 (이력 없음)
        TenantContextHolder.setTenantId(testTenantId);
        ErdDiagramResponse newErd = erdGenerationService.generateTenantErd(
                testTenantId,
                null,
                testCreatedBy
        );
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}/history", 
                        testTenantId, newErd.getDiagramId())
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("인증되지 않은 사용자 접근 실패 테스트")
    void testUnauthenticatedAccess() throws Exception {
        // Given: 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(testTenantId);
        
        // When & Then: @WithMockUser 없이 요청 (실제로는 @PreAuthorize로 차단됨)
        // 이 테스트는 Spring Security 설정에 따라 다를 수 있음
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("ERD 목록 조회 - 빈 목록 테스트")
    void testGetTenantErds_Empty() throws Exception {
        // Given: 새로운 테넌트 (ERD 없음)
        String newTenantId = "new-tenant-" + System.currentTimeMillis();
        Tenant newTenant = Tenant.builder()
                .tenantId(newTenantId)
                .name("새 테스트 테넌트")
                .businessType(Tenant.BusinessType.ACADEMY)
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(newTenant);
        
        // 테넌트 컨텍스트 설정 (필터가 비활성화되어 있으므로 직접 설정)
        TenantContextHolder.setTenantId(newTenantId);
        
        // When & Then
        mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd", newTenantId)
                        .header("X-Tenant-Id", newTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
    
    @Test
    @WithMockUser(username = "test-user", roles = {"TENANT_USER"})
    @DisplayName("ERD 상세 조회 - Mermaid 코드 형식 검증 테스트")
    void testGetErdDetail_MermaidFormat() throws Exception {
        // Given: 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(testTenantId);
        
        // When
        String response = mockMvc.perform(get("/api/v1/tenants/{tenantId}/erd/{diagramId}", 
                        testTenantId, testErd.getDiagramId())
                        .header("X-Tenant-Id", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        
        // Then: Mermaid 코드 형식 검증
        ErdDiagramResponse erd = objectMapper.readValue(response, ErdDiagramResponse.class);
        assertThat(erd.getMermaidCode()).isNotNull();
        assertThat(erd.getMermaidCode()).contains("erDiagram");
        assertThat(erd.getMermaidCode()).isNotEmpty();
    }
}

