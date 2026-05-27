package com.coresolution.consultation.repository;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * {@link ConsultantClientMappingHistory} 리포지토리 — 매핑 변경 이력.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface ConsultantClientMappingHistoryRepository
        extends JpaRepository<ConsultantClientMappingHistory, Long> {

    Page<ConsultantClientMappingHistory>
            findByTenantIdAndMappingIdOrderByCreatedAtDesc(
                    String tenantId, Long mappingId, Pageable pageable);

    Page<ConsultantClientMappingHistory>
            findByTenantIdAndClientIdOrderByCreatedAtDesc(
                    String tenantId, Long clientId, Pageable pageable);

    Page<ConsultantClientMappingHistory>
            findByTenantIdAndEventTypeOrderByCreatedAtDesc(
                    String tenantId, MappingHistoryEventType eventType, Pageable pageable);
}
