package com.coresolution.consultation.service;

import java.math.BigDecimal;

import com.coresolution.consultation.constant.CompensationType;
import com.coresolution.consultation.entity.SessionCompensationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 회기 보상 이력 Service.
 *
 * <p>본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. no-show/late-cancel/extension/
 * partial-refund-rollback 비즈니스 로직은 후속 위임에서 작성.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface SessionCompensationHistoryService {

    SessionCompensationHistory save(SessionCompensationHistory entry);

    /**
     * 회기 보상 기록 헬퍼.
     */
    SessionCompensationHistory record(
            String tenantId,
            Long mappingId,
            Long clientId,
            Long consultantId,
            CompensationType compensationType,
            BigDecimal sessionDelta,
            Integer beforeRemainingSessions,
            Integer afterRemainingSessions,
            Long triggeredByUserId,
            String reason);

    Page<SessionCompensationHistory> findByTenantIdAndMappingId(
            String tenantId, Long mappingId, Pageable pageable);
}
