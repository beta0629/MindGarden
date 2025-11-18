package com.coresolution.core.service;

import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.dto.ErdDiagramHistoryResponse;

import java.util.List;

/**
 * ERD 변경 이력 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdHistoryService {
    
    /**
     * ERD 변경 이력 조회 (diagram_id로)
     */
    List<ErdDiagramHistoryResponse> getHistoryByDiagramId(String diagramId);
    
    /**
     * ERD 변경 이력 조회 (version으로)
     */
    ErdDiagramHistoryResponse getHistoryByVersion(String diagramId, Integer version);
    
    /**
     * ERD 변경 이력 조회 (change_type으로)
     */
    List<ErdDiagramHistoryResponse> getHistoryByChangeType(
            String diagramId, 
            ErdDiagramHistory.ChangeType changeType);
    
    /**
     * ERD 버전 비교
     */
    String compareVersions(String diagramId, Integer fromVersion, Integer toVersion);
}

