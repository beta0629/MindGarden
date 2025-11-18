package com.coresolution.core.service;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.dto.ErdDiagramResponse;

import java.util.List;

/**
 * ERD 메타데이터 저장 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdMetadataService {
    
    /**
     * ERD 메타데이터 저장
     */
    ErdDiagramResponse saveErdMetadata(
            String diagramId,
            String tenantId,
            String name,
            String description,
            ErdDiagram.DiagramType diagramType,
            String moduleType,
            String mermaidCode,
            String textErd,
            ErdDiagram.TriggerSource triggerSource,
            String createdBy
    );
    
    /**
     * ERD 메타데이터 업데이트
     */
    ErdDiagramResponse updateErdMetadata(
            String diagramId,
            String mermaidCode,
            String textErd,
            String updatedBy
    );
    
    /**
     * ERD 변경 이력 저장
     */
    void saveErdHistory(
            String diagramId,
            Integer version,
            ErdDiagramHistory.ChangeType changeType,
            String changeDescription,
            String mermaidCode,
            String diffSummary,
            String changedBy
    );
    
    /**
     * ERD 조회
     */
    ErdDiagramResponse getErdMetadata(String diagramId);
    
    /**
     * 테넌트별 ERD 목록 조회
     */
    List<ErdDiagramResponse> getTenantErdMetadata(String tenantId);
    
    /**
     * 활성 ERD 목록 조회
     */
    List<ErdDiagramResponse> getActiveErdMetadata(ErdDiagram.DiagramType diagramType);
}

