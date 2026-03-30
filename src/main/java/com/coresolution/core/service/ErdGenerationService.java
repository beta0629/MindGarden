package com.coresolution.core.service;

import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.dto.ErdDiagramResponse;

import java.util.List;

/**
 * ERD 생성 서비스 인터페이스
 * 테넌트별, 모듈별 ERD 생성 및 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface ErdGenerationService {
    
    /**
     * 전체 시스템 ERD 생성
     */
    ErdDiagramResponse generateFullSystemErd(String schemaName, String createdBy);
    
    /**
     * 테넌트별 ERD 생성
     */
    ErdDiagramResponse generateTenantErd(String tenantId, String schemaName, String createdBy);
    
    /**
     * 모듈별 ERD 생성
     */
    ErdDiagramResponse generateModuleErd(String moduleType, String schemaName, String createdBy);
    
    /**
     * 커스텀 ERD 생성 (특정 테이블 목록 지정)
     */
    ErdDiagramResponse generateCustomErd(List<String> tableNames, String name, 
                                         String description, String schemaName, String createdBy);
    
    /**
     * ERD 재생성 (기존 ERD 업데이트)
     */
    ErdDiagramResponse regenerateErd(String diagramId, String schemaName, String updatedBy);
    
    /**
     * ERD 조회
     */
    ErdDiagramResponse getErd(String diagramId);
    
    /**
     * 테넌트별 ERD 목록 조회
     */
    List<ErdDiagramResponse> getTenantErds(String tenantId);
    
    /**
     * 활성 ERD 목록 조회
     */
    List<ErdDiagramResponse> getActiveErds(ErdDiagram.DiagramType diagramType);
}

