package com.coresolution.consultation.repository;

import com.coresolution.consultation.constant.CompensationType;
import com.coresolution.consultation.entity.SessionCompensationHistory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * {@link SessionCompensationHistory} 리포지토리 — 회기 보상 이력.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface SessionCompensationHistoryRepository
        extends JpaRepository<SessionCompensationHistory, Long> {

    Page<SessionCompensationHistory>
            findByTenantIdAndMappingIdOrderByCreatedAtDesc(
                    String tenantId, Long mappingId, Pageable pageable);

    Page<SessionCompensationHistory>
            findByTenantIdAndClientIdOrderByCreatedAtDesc(
                    String tenantId, Long clientId, Pageable pageable);

    Page<SessionCompensationHistory>
            findByTenantIdAndCompensationTypeOrderByCreatedAtDesc(
                    String tenantId, CompensationType compensationType, Pageable pageable);
}
