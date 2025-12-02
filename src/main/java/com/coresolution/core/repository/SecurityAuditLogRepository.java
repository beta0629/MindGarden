package com.coresolution.core.repository;

import com.coresolution.core.domain.SecurityAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 보안 감사 로그 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Repository
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long> {
    
    /**
     * 테넌트별 조회
     */
    List<SecurityAuditLog> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    
    /**
     * 이벤트 타입별 조회
     */
    List<SecurityAuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType);
    
    /**
     * 사용자별 조회
     */
    List<SecurityAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * 기간별 조회
     */
    List<SecurityAuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
        LocalDateTime startDate,
        LocalDateTime endDate
    );
    
    /**
     * 실패 이벤트 조회
     */
    List<SecurityAuditLog> findByResultAndCreatedAtAfterOrderByCreatedAtDesc(
        String result,
        LocalDateTime since
    );
}

