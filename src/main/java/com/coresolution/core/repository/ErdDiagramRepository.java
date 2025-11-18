package com.coresolution.core.repository;

import com.coresolution.core.domain.ErdDiagram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ERD 다이어그램 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface ErdDiagramRepository extends JpaRepository<ErdDiagram, Long> {
    
    /**
     * diagram_id로 조회
     */
    Optional<ErdDiagram> findByDiagramId(String diagramId);
    
    /**
     * tenant_id로 조회 (활성만)
     */
    List<ErdDiagram> findByTenantIdAndIsActiveTrue(String tenantId);
    
    /**
     * diagram_type과 is_active로 조회
     */
    List<ErdDiagram> findByDiagramTypeAndIsActiveTrue(ErdDiagram.DiagramType diagramType);
    
    /**
     * tenant_id와 diagram_type으로 조회
     */
    List<ErdDiagram> findByTenantIdAndDiagramTypeAndIsActiveTrue(
            String tenantId, 
            ErdDiagram.DiagramType diagramType);
    
    /**
     * module_type으로 조회
     */
    List<ErdDiagram> findByModuleTypeAndIsActiveTrue(String moduleType);
    
    /**
     * is_public이 true인 ERD 조회
     */
    @Query("SELECT e FROM ErdDiagram e WHERE e.isPublic = true AND e.isActive = true")
    List<ErdDiagram> findPublicErds();
}

