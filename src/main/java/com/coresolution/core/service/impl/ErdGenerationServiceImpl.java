package com.coresolution.core.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.model.SchemaTable;
import com.coresolution.core.repository.ErdDiagramRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdMetadataService;
import com.coresolution.core.service.MermaidErdService;
import com.coresolution.core.service.SchemaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * ERD 생성 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
public class ErdGenerationServiceImpl implements ErdGenerationService {
    
    private final SchemaService schemaService;
    private final MermaidErdService mermaidErdService;
    private final ErdDiagramRepository erdDiagramRepository;
    private final ErdMetadataService erdMetadataService;
    
    /**
     * 의존성 주입 (SchemaService는 지연 주입하여 순환 참조 방지)
     */
    @Autowired
    public ErdGenerationServiceImpl(
            @Lazy SchemaService schemaService,
            MermaidErdService mermaidErdService,
            ErdDiagramRepository erdDiagramRepository,
            ErdMetadataService erdMetadataService) {
        this.schemaService = schemaService;
        this.mermaidErdService = mermaidErdService;
        this.erdDiagramRepository = erdDiagramRepository;
        this.erdMetadataService = erdMetadataService;
    }
    
    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;
    
    @Override
    public ErdDiagramResponse generateFullSystemErd(String schemaName, String createdBy) {
        log.info("전체 시스템 ERD 생성 시작: schemaName={}", schemaName);
        
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> tables = schemaService.getAllTables(targetSchema);
        
        String mermaidCode = mermaidErdService.generateMermaidErd(tables);
        String textErd = mermaidErdService.generateTextErd(tables);
        
        ErdDiagram diagram = ErdDiagram.builder()
                .diagramId(UUID.randomUUID().toString())
                .tenantId(null) // 전체 시스템 ERD
                .name("전체 시스템 ERD")
                .description("전체 데이터베이스 스키마 ERD")
                .diagramType(ErdDiagram.DiagramType.FULL)
                .moduleType(null)
                .mermaidCode(mermaidCode)
                .textErd(textErd)
                .version(1)
                .isActive(true)
                .isPublic(false)
                .triggerSource(ErdDiagram.TriggerSource.MANUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        diagram = erdDiagramRepository.save(diagram);
        
        // 변경 이력 기록
        erdMetadataService.saveErdHistory(
                diagram.getDiagramId(),
                diagram.getVersion(),
                ErdDiagramHistory.ChangeType.CREATED,
                "전체 시스템 ERD 생성",
                mermaidCode,
                null,
                createdBy
        );
        
        log.info("전체 시스템 ERD 생성 완료: diagramId={}", diagram.getDiagramId());
        
        return toResponse(diagram);
    }
    
    @Override
    public ErdDiagramResponse generateTenantErd(String tenantId, String schemaName, String createdBy) {
        log.info("테넌트별 ERD 생성 시작: tenantId={}, schemaName={}", tenantId, schemaName);
        
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        
        // 테넌트별 테이블 조회 (tenant_id 컬럼이 있는 테이블)
        List<SchemaTable> tenantTables = schemaService.getTenantTables(targetSchema, tenantId);
        
        // 공통 테이블도 포함 (tenants, branches 등)
        List<SchemaTable> commonTables = schemaService.getAllTables(targetSchema).stream()
                .filter(table -> isCommonTable(table.getTableName()))
                .collect(Collectors.toList());
        
        // 테넌트 테이블과 공통 테이블 합치기
        tenantTables.addAll(commonTables);
        
        String mermaidCode = mermaidErdService.generateMermaidErd(tenantTables);
        String textErd = mermaidErdService.generateTextErd(tenantTables);
        
        ErdDiagram diagram = ErdDiagram.builder()
                .diagramId(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .name("테넌트 ERD: " + tenantId)
                .description("테넌트별 데이터베이스 스키마 ERD")
                .diagramType(ErdDiagram.DiagramType.TENANT)
                .moduleType(null)
                .mermaidCode(mermaidCode)
                .textErd(textErd)
                .version(1)
                .isActive(true)
                .isPublic(true) // 테넌트 포털에서 조회 가능
                .triggerSource(ErdDiagram.TriggerSource.MANUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        diagram = erdDiagramRepository.save(diagram);
        
        // 변경 이력 기록
        erdMetadataService.saveErdHistory(
                diagram.getDiagramId(),
                diagram.getVersion(),
                ErdDiagramHistory.ChangeType.CREATED,
                "테넌트 ERD 생성: " + tenantId,
                mermaidCode,
                null,
                createdBy
        );
        
        log.info("테넌트별 ERD 생성 완료: diagramId={}, tenantId={}", diagram.getDiagramId(), tenantId);
        
        return toResponse(diagram);
    }
    
    @Override
    public ErdDiagramResponse generateModuleErd(String moduleType, String schemaName, String createdBy) {
        log.info("모듈별 ERD 생성 시작: moduleType={}, schemaName={}", moduleType, schemaName);
        
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        
        // 모듈별 테이블 조회
        String modulePrefix = getModulePrefix(moduleType);
        List<SchemaTable> moduleTables = schemaService.getModuleTables(targetSchema, modulePrefix);
        
        String mermaidCode = mermaidErdService.generateMermaidErd(moduleTables);
        String textErd = mermaidErdService.generateTextErd(moduleTables);
        
        ErdDiagram diagram = ErdDiagram.builder()
                .diagramId(UUID.randomUUID().toString())
                .tenantId(null)
                .name("모듈 ERD: " + moduleType)
                .description(moduleType + " 모듈 데이터베이스 스키마 ERD")
                .diagramType(ErdDiagram.DiagramType.MODULE)
                .moduleType(moduleType)
                .mermaidCode(mermaidCode)
                .textErd(textErd)
                .version(1)
                .isActive(true)
                .isPublic(false)
                .triggerSource(ErdDiagram.TriggerSource.MANUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        diagram = erdDiagramRepository.save(diagram);
        log.info("모듈별 ERD 생성 완료: diagramId={}, moduleType={}", diagram.getDiagramId(), moduleType);
        
        return toResponse(diagram);
    }
    
    @Override
    public ErdDiagramResponse generateCustomErd(List<String> tableNames, String name, 
                                               String description, String schemaName, String createdBy) {
        log.info("커스텀 ERD 생성 시작: tableNames={}, name={}", tableNames, name);
        
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> allTables = schemaService.getAllTables(targetSchema);
        
        // 지정된 테이블만 필터링
        List<SchemaTable> customTables = allTables.stream()
                .filter(table -> tableNames.contains(table.getTableName()))
                .collect(Collectors.toList());
        
        String mermaidCode = mermaidErdService.generateMermaidErdForTables(allTables, tableNames);
        String textErd = mermaidErdService.generateTextErd(customTables);
        
        ErdDiagram diagram = ErdDiagram.builder()
                .diagramId(UUID.randomUUID().toString())
                .tenantId(null)
                .name(name != null ? name : "커스텀 ERD")
                .description(description)
                .diagramType(ErdDiagram.DiagramType.CUSTOM)
                .moduleType(null)
                .mermaidCode(mermaidCode)
                .textErd(textErd)
                .version(1)
                .isActive(true)
                .isPublic(false)
                .triggerSource(ErdDiagram.TriggerSource.MANUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        diagram = erdDiagramRepository.save(diagram);
        log.info("커스텀 ERD 생성 완료: diagramId={}", diagram.getDiagramId());
        
        return toResponse(diagram);
    }
    
    @Override
    public ErdDiagramResponse regenerateErd(String diagramId, String schemaName, String updatedBy) {
        log.info("ERD 재생성 시작: diagramId={}", diagramId);
        
        ErdDiagram diagram = erdDiagramRepository.findByDiagramId(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("ERD를 찾을 수 없습니다: " + diagramId));
        
        String targetSchema = schemaName != null ? schemaName : defaultSchemaName;
        List<SchemaTable> tables;
        
        // ERD 타입에 따라 테이블 조회
        switch (diagram.getDiagramType()) {
            case TENANT:
                tables = schemaService.getTenantTables(targetSchema, diagram.getTenantId());
                break;
            case MODULE:
                String modulePrefix = getModulePrefix(diagram.getModuleType());
                tables = schemaService.getModuleTables(targetSchema, modulePrefix);
                break;
            case FULL:
            default:
                tables = schemaService.getAllTables(targetSchema);
                break;
        }
        
        String oldMermaidCode = diagram.getMermaidCode();
        String mermaidCode = mermaidErdService.generateMermaidErd(tables);
        String textErd = mermaidErdService.generateTextErd(tables);
        
        // 버전 증가
        int newVersion = diagram.getVersion() + 1;
        diagram.setVersion(newVersion);
        diagram.setMermaidCode(mermaidCode);
        diagram.setTextErd(textErd);
        diagram.setUpdatedAt(LocalDateTime.now());
        diagram.setUpdatedBy(updatedBy);
        
        diagram = erdDiagramRepository.save(diagram);
        
        // 변경 이력 기록
        String diffSummary = generateDiffSummary(oldMermaidCode, mermaidCode);
        erdMetadataService.saveErdHistory(
                diagram.getDiagramId(),
                newVersion,
                ErdDiagramHistory.ChangeType.UPDATED,
                "ERD 재생성 (스키마 변경 감지)",
                mermaidCode,
                diffSummary,
                updatedBy
        );
        
        log.info("ERD 재생성 완료: diagramId={}, version={}", diagram.getDiagramId(), newVersion);
        
        return toResponse(diagram);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ErdDiagramResponse getErd(String diagramId) {
        ErdDiagram diagram = erdDiagramRepository.findByDiagramId(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("ERD를 찾을 수 없습니다: " + diagramId));
        return toResponse(diagram);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ErdDiagramResponse> getTenantErds(String tenantId) {
        List<ErdDiagram> diagrams = erdDiagramRepository.findByTenantIdAndIsActiveTrue(tenantId);
        return diagrams.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ErdDiagramResponse> getActiveErds(ErdDiagram.DiagramType diagramType) {
        List<ErdDiagram> diagrams = erdDiagramRepository.findByDiagramTypeAndIsActiveTrue(diagramType);
        return diagrams.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 공통 테이블인지 확인
     */
    private boolean isCommonTable(String tableName) {
        String lowerName = tableName.toLowerCase();
        return lowerName.equals("tenants") || 
               lowerName.equals("branches") ||
               lowerName.startsWith("auth_") ||
               lowerName.startsWith("staff_") ||
               lowerName.startsWith("consumer_");
    }
    
    /**
     * 모듈 타입에 따른 테이블 접두사 가져오기
     */
    private String getModulePrefix(String moduleType) {
        if (moduleType == null) {
            return "";
        }
        
        switch (moduleType.toUpperCase()) {
            case "ACADEMY":
                return "academy_";
            case "FOOD_SERVICE":
                return "food_";
            case "CONSULTATION":
                return "consultation_";
            default:
                return moduleType.toLowerCase() + "_";
        }
    }
    
    /**
     * 변경 사항 요약 생성
     */
    private String generateDiffSummary(String oldCode, String newCode) {
        if (oldCode == null || newCode == null) {
            return "초기 생성 또는 전체 변경";
        }
        
        // 간단한 변경 사항 요약
        int oldLines = oldCode.split("\n").length;
        int newLines = newCode.split("\n").length;
        
        if (oldLines != newLines) {
            return String.format("라인 수 변경: %d -> %d", oldLines, newLines);
        }
        
        // 테이블 수 비교 (간단한 추정)
        long oldTableCount = oldCode.split("\\{").length - 1;
        long newTableCount = newCode.split("\\{").length - 1;
        
        if (oldTableCount != newTableCount) {
            return String.format("테이블 수 변경: %d -> %d", oldTableCount, newTableCount);
        }
        
        return "내용 변경";
    }
    
    /**
     * 엔티티를 응답 DTO로 변환
     */
    private ErdDiagramResponse toResponse(ErdDiagram diagram) {
        return ErdDiagramResponse.builder()
                .diagramId(diagram.getDiagramId())
                .tenantId(diagram.getTenantId())
                .name(diagram.getName())
                .description(diagram.getDescription())
                .diagramType(diagram.getDiagramType())
                .moduleType(diagram.getModuleType())
                .mermaidCode(diagram.getMermaidCode())
                .textErd(diagram.getTextErd())
                .version(diagram.getVersion())
                .isActive(diagram.getIsActive())
                .isPublic(diagram.getIsPublic())
                .triggerSource(diagram.getTriggerSource())
                .createdAt(diagram.getCreatedAt())
                .updatedAt(diagram.getUpdatedAt())
                .createdBy(diagram.getCreatedBy())
                .updatedBy(diagram.getUpdatedBy())
                .build();
    }
}

