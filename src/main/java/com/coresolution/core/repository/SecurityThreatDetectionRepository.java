package com.coresolution.core.repository;

import com.coresolution.core.domain.SecurityThreatDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    
    /**
     * 테넌트별 최근 위협 조회
     */
    List<SecurityThreatDetection> findByTenantIdAndDetectedAtAfterOrderByDetectedAtDesc(String tenantId, LocalDateTime since);
    
    /**
     * 기간별 위협 조회
     */
    List<SecurityThreatDetection> findByDetectedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * 테넌트별 기간별 위협 조회
     */
    List<SecurityThreatDetection> findByTenantIdAndDetectedAtBetween(String tenantId, LocalDateTime start, LocalDateTime end);

    /**
     * PK + 테넌트 범위 조회 (tenantId가 null이면 플랫폼 공통 레코드만 일치)
     */
    @Query("SELECT s FROM SecurityThreatDetection s WHERE s.id = :id AND "
        + "((:tenantId IS NULL AND s.tenantId IS NULL) OR s.tenantId = :tenantId)")
    Optional<SecurityThreatDetection> findByIdAndTenantId(@Param("id") Long id, @Param("tenantId") String tenantId);
}

