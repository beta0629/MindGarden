package com.coresolution.core.repository;

import com.coresolution.core.domain.SecurityThreatDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 보안 위협 탐지 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface SecurityThreatDetectionRepository extends JpaRepository<SecurityThreatDetection, Long> {
    
    /**
     * IP별 위협 조회
     */
    List<SecurityThreatDetection> findBySourceIpOrderByDetectedAtDesc(String sourceIp);
    
    /**
     * 최근 위협 조회
     */
    List<SecurityThreatDetection> findByDetectedAtAfterOrderByDetectedAtDesc(LocalDateTime since);
    
    /**
     * 차단된 위협 조회
     */
    List<SecurityThreatDetection> findByBlockedTrueOrderByDetectedAtDesc();
    
    /**
     * IP별 최근 1시간 위협 카운트
     */
    long countBySourceIpAndDetectedAtAfter(String sourceIp, LocalDateTime since);
}

