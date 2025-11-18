package com.coresolution.core.service.impl;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdMetadataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ERD 생성 서비스 통합 테스트
 * 온보딩 승인 시 ERD 자동 생성 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("ERD 생성 서비스 통합 테스트")
class ErdGenerationServiceIntegrationTest {
    
    @Autowired
    private ErdGenerationService erdGenerationService;
    
    @Autowired
    private ErdMetadataService erdMetadataService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    private String testTenantId;
    private String testSchemaName;
    private String testCreatedBy;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-" + System.currentTimeMillis();
        testSchemaName = null; // 기본 스키마 사용
        testCreatedBy = "test-user";
        
        // 테스트용 테넌트 생성 (외래 키 제약 조건을 위해 필수)
        Tenant testTenant = Tenant.builder()
                .tenantId(testTenantId)
                .name("테스트 테넌트")
                .businessType(Tenant.BusinessType.ACADEMY)
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenantRepository.save(testTenant);
    }
    
    @Test
    @DisplayName("전체 시스템 ERD 생성 테스트")
    void testGenerateFullSystemErd() {
        // When
        ErdDiagramResponse response = erdGenerationService.generateFullSystemErd(
                testSchemaName,
                testCreatedBy
        );
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDiagramId()).isNotNull();
        assertThat(response.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.FULL);
        assertThat(response.getMermaidCode()).isNotNull();
        assertThat(response.getMermaidCode()).contains("erDiagram");
        assertThat(response.getTextErd()).isNotNull();
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getIsActive()).isTrue();
    }
    
    @Test
    @DisplayName("테넌트별 ERD 생성 테스트")
    void testGenerateTenantErd() {
        // When
        ErdDiagramResponse response = erdGenerationService.generateTenantErd(
                testTenantId,
                testSchemaName,
                testCreatedBy
        );
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDiagramId()).isNotNull();
        assertThat(response.getTenantId()).isEqualTo(testTenantId);
        assertThat(response.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.TENANT);
        assertThat(response.getMermaidCode()).isNotNull();
        assertThat(response.getMermaidCode()).contains("erDiagram");
        assertThat(response.getTextErd()).isNotNull();
        assertThat(response.getIsPublic()).isTrue(); // 테넌트 ERD는 공개
        assertThat(response.getTriggerSource()).isEqualTo(ErdDiagram.TriggerSource.MANUAL);
    }
    
    @Test
    @DisplayName("모듈별 ERD 생성 테스트")
    void testGenerateModuleErd() {
        // Given
        String moduleType = "ACADEMY";
        
        // When
        ErdDiagramResponse response = erdGenerationService.generateModuleErd(
                moduleType,
                testSchemaName,
                testCreatedBy
        );
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDiagramId()).isNotNull();
        assertThat(response.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.MODULE);
        assertThat(response.getModuleType()).isEqualTo(moduleType);
        assertThat(response.getMermaidCode()).isNotNull();
        assertThat(response.getMermaidCode()).contains("erDiagram");
    }
    
    @Test
    @DisplayName("커스텀 ERD 생성 테스트")
    void testGenerateCustomErd() {
        // Given
        List<String> tableNames = List.of("tenants", "branches", "users");
        String name = "커스텀 ERD 테스트";
        String description = "특정 테이블만 포함하는 ERD";
        
        // When
        ErdDiagramResponse response = erdGenerationService.generateCustomErd(
                tableNames,
                name,
                description,
                testSchemaName,
                testCreatedBy
        );
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDiagramId()).isNotNull();
        assertThat(response.getName()).isEqualTo(name);
        assertThat(response.getDescription()).isEqualTo(description);
        assertThat(response.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.CUSTOM);
        assertThat(response.getMermaidCode()).isNotNull();
    }
    
    @Test
    @DisplayName("ERD 재생성 테스트")
    void testRegenerateErd() {
        // Given: 먼저 ERD 생성
        ErdDiagramResponse original = erdGenerationService.generateTenantErd(
                testTenantId,
                testSchemaName,
                testCreatedBy
        );
        
        // When: ERD 재생성
        ErdDiagramResponse regenerated = erdGenerationService.regenerateErd(
                original.getDiagramId(),
                testSchemaName,
                "updated-user"
        );
        
        // Then
        assertThat(regenerated).isNotNull();
        assertThat(regenerated.getDiagramId()).isEqualTo(original.getDiagramId());
        assertThat(regenerated.getVersion()).isGreaterThan(original.getVersion());
        assertThat(regenerated.getMermaidCode()).isNotNull();
    }
    
    @Test
    @DisplayName("테넌트별 ERD 목록 조회 테스트")
    void testGetTenantErds() {
        // Given: 테넌트 ERD 생성
        erdGenerationService.generateTenantErd(
                testTenantId,
                testSchemaName,
                testCreatedBy
        );
        
        // When
        List<ErdDiagramResponse> erds = erdGenerationService.getTenantErds(testTenantId);
        
        // Then
        assertThat(erds).isNotNull();
        // 생성된 ERD가 목록에 포함되어 있는지 확인
        assertThat(erds.stream()
                .anyMatch(erd -> erd.getTenantId().equals(testTenantId)))
                .isTrue();
    }
    
    @Test
    @DisplayName("ERD 메타데이터 저장 테스트")
    void testSaveErdMetadata() {
        // Given
        String diagramId = "test-diagram-" + System.currentTimeMillis();
        String mermaidCode = "erDiagram\n    TEST_TABLE {\n        VARCHAR id PK\n    }";
        String textErd = "테스트 ERD";
        
        // When
        ErdDiagramResponse response = erdMetadataService.saveErdMetadata(
                diagramId,
                testTenantId,
                "테스트 ERD",
                "테스트 설명",
                ErdDiagram.DiagramType.TENANT,
                "ACADEMY",
                mermaidCode,
                textErd,
                ErdDiagram.TriggerSource.MANUAL,
                testCreatedBy
        );
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDiagramId()).isEqualTo(diagramId);
        assertThat(response.getMermaidCode()).isEqualTo(mermaidCode);
        assertThat(response.getTextErd()).isEqualTo(textErd);
        assertThat(response.getVersion()).isEqualTo(1);
        
        // ERD 조회 테스트
        ErdDiagramResponse retrieved = erdMetadataService.getErdMetadata(diagramId);
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getDiagramId()).isEqualTo(diagramId);
    }
    
    @Test
    @DisplayName("ERD 변경 이력 저장 테스트")
    void testSaveErdHistory() {
        // Given: ERD 생성
        ErdDiagramResponse erd = erdGenerationService.generateTenantErd(
                testTenantId,
                testSchemaName,
                testCreatedBy
        );
        
        // When: 변경 이력 저장
        erdMetadataService.saveErdHistory(
                erd.getDiagramId(),
                1,
                ErdDiagramHistory.ChangeType.CREATED,
                "ERD 생성",
                erd.getMermaidCode(),
                null,
                testCreatedBy
        );
        
        // Then: 이력이 저장되었는지 확인 (Repository를 통해 직접 확인 가능)
        // 실제 검증은 Repository 테스트에서 수행
    }
}

