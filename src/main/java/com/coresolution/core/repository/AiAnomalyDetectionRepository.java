package com.coresolution.core.repository;

import com.coresolution.core.domain.AiAnomalyDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 이상 탐지 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface AiAnomalyDetectionRepository extends JpaRepository<AiAnomalyDetection, Long> {
    
    /**
     * 테넌트별 미해결 이상 조회
     */
    List<AiAnomalyDetection> findByTenantIdAndResolvedAtIsNullOrderByDetectedAtDesc(String tenantId);
    
    /**
     * 심각도별 미해결 이상 조회
     */
    List<AiAnomalyDetection> findBySeverityAndResolvedAtIsNullOrderByDetectedAtDesc(String severity);
    
    /**
     * 최근 이상 탐지 조회
     */
    List<AiAnomalyDetection> findByDetectedAtAfterOrderByDetectedAtDesc(LocalDateTime since);
}

