package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;

import com.coresolution.consultation.constant.CompensationType;
import com.coresolution.consultation.entity.SessionCompensationHistory;
import com.coresolution.consultation.repository.SessionCompensationHistoryRepository;
import com.coresolution.consultation.service.SessionCompensationHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SessionCompensationHistoryService} 스켈레톤 구현체.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionCompensationHistoryServiceImpl implements SessionCompensationHistoryService {

    private final SessionCompensationHistoryRepository sessionCompensationHistoryRepository;

    @Override
    @Transactional
    public SessionCompensationHistory save(SessionCompensationHistory entry) {
        return sessionCompensationHistoryRepository.save(entry);
    }

    @Override
    @Transactional
    public SessionCompensationHistory record(
            String tenantId,
            Long mappingId,
            Long clientId,
            Long consultantId,
            CompensationType compensationType,
            BigDecimal sessionDelta,
            Integer beforeRemainingSessions,
            Integer afterRemainingSessions,
            Long triggeredByUserId,
            String reason) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — 매핑 remaining_sessions 갱신 게이트, 보상 권한 등
        SessionCompensationHistory entry = SessionCompensationHistory.builder()
                .tenantId(tenantId)
                .mappingId(mappingId)
                .clientId(clientId)
                .consultantId(consultantId)
                .compensationType(compensationType)
                .sessionDelta(sessionDelta)
                .beforeRemainingSessions(beforeRemainingSessions)
                .afterRemainingSessions(afterRemainingSessions)
                .triggeredByUserId(triggeredByUserId)
                .reason(reason)
                .build();
        return sessionCompensationHistoryRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SessionCompensationHistory> findByTenantIdAndMappingId(
            String tenantId, Long mappingId, Pageable pageable) {
        return sessionCompensationHistoryRepository
                .findByTenantIdAndMappingIdOrderByCreatedAtDesc(tenantId, mappingId, pageable);
    }
}
