package com.coresolution.core.service.impl;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.repository.ErdDiagramHistoryRepository;
import com.coresolution.core.repository.ErdDiagramRepository;
import com.coresolution.core.service.ErdMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ERD 메타데이터 저장 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ErdMetadataServiceImpl implements ErdMetadataService {
    
    private final ErdDiagramRepository erdDiagramRepository;
    private final ErdDiagramHistoryRepository erdDiagramHistoryRepository;
    
    @Override
    public ErdDiagramResponse saveErdMetadata(
            String diagramId,
            String tenantId,
            String name,
            String description,
            ErdDiagram.DiagramType diagramType,
            String moduleType,
            String mermaidCode,
            String textErd,
            ErdDiagram.TriggerSource triggerSource,
            String createdBy) {
        
        log.info("ERD 메타데이터 저장: diagramId={}, tenantId={}, name={}", diagramId, tenantId, name);
        
        ErdDiagram diagram = ErdDiagram.builder()
                .diagramId(diagramId != null ? diagramId : UUID.randomUUID().toString())
                .tenantId(tenantId)
                .name(name)
                .description(description)
                .diagramType(diagramType)
                .moduleType(moduleType)
                .mermaidCode(mermaidCode)
                .textErd(textErd)
                .version(1)
                .isActive(true)
                .isPublic(diagramType == ErdDiagram.DiagramType.TENANT) // 테넌트 ERD는 공개
                .triggerSource(triggerSource)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        diagram = erdDiagramRepository.save(diagram);
        
        // 변경 이력 기록
        saveErdHistory(
                diagram.getDiagramId(),
                diagram.getVersion(),
                ErdDiagramHistory.ChangeType.CREATED,
                "ERD 생성",
                mermaidCode,
                null,
                createdBy
        );
        
        log.info("ERD 메타데이터 저장 완료: diagramId={}", diagram.getDiagramId());
        return toResponse(diagram);
    }
    
    @Override
    public ErdDiagramResponse updateErdMetadata(
            String diagramId,
            String mermaidCode,
            String textErd,
            String updatedBy) {
        
        log.info("ERD 메타데이터 업데이트: diagramId={}", diagramId);
        
        ErdDiagram diagram = erdDiagramRepository.findByDiagramId(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("ERD를 찾을 수 없습니다: " + diagramId));
        
        String oldMermaidCode = diagram.getMermaidCode();
        
        // 버전 증가
        diagram.setVersion(diagram.getVersion() + 1);
        diagram.setMermaidCode(mermaidCode);
        diagram.setTextErd(textErd);
        diagram.setUpdatedAt(LocalDateTime.now());
        diagram.setUpdatedBy(updatedBy);
        
        diagram = erdDiagramRepository.save(diagram);
        
        // 변경 이력 기록
        String diffSummary = generateDiffSummary(oldMermaidCode, mermaidCode);
        saveErdHistory(
                diagram.getDiagramId(),
                diagram.getVersion(),
                ErdDiagramHistory.ChangeType.UPDATED,
                "ERD 업데이트",
                mermaidCode,
                diffSummary,
                updatedBy
        );
        
        log.info("ERD 메타데이터 업데이트 완료: diagramId={}, version={}", diagramId, diagram.getVersion());
        return toResponse(diagram);
    }
    
    @Override
    public void saveErdHistory(
            String diagramId,
            Integer version,
            ErdDiagramHistory.ChangeType changeType,
            String changeDescription,
            String mermaidCode,
            String diffSummary,
            String changedBy) {
        
        log.debug("ERD 변경 이력 저장: diagramId={}, version={}, changeType={}", 
                diagramId, version, changeType);
        
        ErdDiagramHistory history = ErdDiagramHistory.builder()
                .diagramId(diagramId)
                .version(version)
                .changeType(changeType)
                .changeDescription(changeDescription)
                .mermaidCode(mermaidCode)
                .diffSummary(diffSummary)
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .build();
        
        erdDiagramHistoryRepository.save(history);
    }
    
    @Override
    @Transactional(readOnly = true)
    public ErdDiagramResponse getErdMetadata(String diagramId) {
        ErdDiagram diagram = erdDiagramRepository.findByDiagramId(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("ERD를 찾을 수 없습니다: " + diagramId));
        return toResponse(diagram);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ErdDiagramResponse> getTenantErdMetadata(String tenantId) {
        List<ErdDiagram> diagrams = erdDiagramRepository.findByTenantIdAndIsActiveTrue(tenantId);
        return diagrams.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ErdDiagramResponse> getActiveErdMetadata(ErdDiagram.DiagramType diagramType) {
        List<ErdDiagram> diagrams = erdDiagramRepository.findByDiagramTypeAndIsActiveTrue(diagramType);
        return diagrams.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 변경 사항 요약 생성
     */
    private String generateDiffSummary(String oldCode, String newCode) {
        if (oldCode == null || newCode == null) {
            return "초기 생성 또는 전체 변경";
        }
        
        // 간단한 변경 사항 요약 (실제로는 더 정교한 diff 알고리즘 사용 가능)
        int oldLines = oldCode.split("\n").length;
        int newLines = newCode.split("\n").length;
        
        if (oldLines != newLines) {
            return String.format("라인 수 변경: %d -> %d", oldLines, newLines);
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

