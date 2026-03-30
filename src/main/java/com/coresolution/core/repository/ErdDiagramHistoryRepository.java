package com.coresolution.core.repository;

import com.coresolution.core.domain.ErdDiagramHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ERD 다이어그램 변경 이력 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface ErdDiagramHistoryRepository extends JpaRepository<ErdDiagramHistory, Long> {
    
    /**
     * diagram_id로 조회 (최신순)
     */
    List<ErdDiagramHistory> findByDiagramIdOrderByChangedAtDesc(String diagramId);
    
    /**
     * diagram_id와 version으로 조회
     */
    Optional<ErdDiagramHistory> findByDiagramIdAndVersion(String diagramId, Integer version);
    
    /**
     * diagram_id와 change_type으로 조회
     */
    List<ErdDiagramHistory> findByDiagramIdAndChangeTypeOrderByChangedAtDesc(
            String diagramId, 
            ErdDiagramHistory.ChangeType changeType);
    
    /**
     * changed_by로 조회
     */
    List<ErdDiagramHistory> findByChangedByOrderByChangedAtDesc(String changedBy);
}

