package com.coresolution.core.controller.ops;

import com.coresolution.core.dto.CustomErdGenerationRequest;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.SchemaService;
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

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * HQ 운영 포털 ERD 관리 API 통합 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("HQ 운영 포털 ERD 관리 API 통합 테스트")
class ErdOpsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ErdGenerationService erdGenerationService;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private ObjectMapper objectMapper;

    private String testSchemaName;

    @BeforeEach
    void setUp() {
        testSchemaName = "core_solution";
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("모든 ERD 목록 조회 - 성공")
    void testGetAllErds_Success() throws Exception {
        // Given: ERD 생성
        erdGenerationService.generateFullSystemErd(testSchemaName, "test-user");

        // When & Then
        mockMvc.perform(get("/api/v1/ops/erd")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("ERD 상세 조회 - 성공")
    void testGetErdDetail_Success() throws Exception {
        // Given: ERD 생성
        ErdDiagramResponse erd = erdGenerationService.generateFullSystemErd(testSchemaName, "test-user");

        // When & Then
        mockMvc.perform(get("/api/v1/ops/erd/{diagramId}", erd.getDiagramId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagramId").value(erd.getDiagramId()))
                .andExpect(jsonPath("$.name").exists())
                .andExpect(jsonPath("$.mermaidCode").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("전체 시스템 ERD 생성 - 성공")
    void testGenerateFullSystemErd_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/v1/ops/erd/generate/full-system")
                        .param("schemaName", testSchemaName)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagramId").exists())
                .andExpect(jsonPath("$.diagramType").value("FULL"))
                .andExpect(jsonPath("$.mermaidCode").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("커스텀 ERD 생성 - 성공")
    void testGenerateCustomErd_Success() throws Exception {
        // Given: 테이블 목록 조회
        List<String> tableNames = schemaService.getTableNames(testSchemaName);
        assertFalse(tableNames.isEmpty(), "테이블 목록이 비어있습니다.");

        // 선택할 테이블 (최대 5개)
        List<String> selectedTables = tableNames.subList(0, Math.min(5, tableNames.size()));

        CustomErdGenerationRequest request = CustomErdGenerationRequest.builder()
                .tableNames(selectedTables)
                .name("테스트 커스텀 ERD")
                .description("통합 테스트용 커스텀 ERD")
                .schemaName(testSchemaName)
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/ops/erd/generate/custom")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagramId").exists())
                .andExpect(jsonPath("$.diagramType").value("CUSTOM"))
                .andExpect(jsonPath("$.name").value("테스트 커스텀 ERD"))
                .andExpect(jsonPath("$.mermaidCode").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("커스텀 ERD 생성 - 실패 (테이블 목록 누락)")
    void testGenerateCustomErd_Failed_EmptyTableNames() throws Exception {
        CustomErdGenerationRequest request = CustomErdGenerationRequest.builder()
                .tableNames(Arrays.asList())
                .name("테스트 커스텀 ERD")
                .schemaName(testSchemaName)
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/ops/erd/generate/custom")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("테이블 목록 조회 - 성공")
    void testGetTableNames_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/ops/erd/tables")
                        .param("schemaName", testSchemaName)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("ERD 버전 비교 - 성공")
    void testCompareVersions_Success() throws Exception {
        // Given: ERD 생성 및 재생성
        ErdDiagramResponse erd1 = erdGenerationService.generateFullSystemErd(testSchemaName, "test-user");
        erdGenerationService.regenerateErd(erd1.getDiagramId(), testSchemaName, "test-user");

        // When & Then
        mockMvc.perform(get("/api/v1/ops/erd/{diagramId}/compare", erd1.getDiagramId())
                        .param("fromVersion", "1")
                        .param("toVersion", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}

