package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.coresolution.consultation.repository.ConsultantClientMappingHistoryRepository;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ConsultantClientMappingHistoryService} 스켈레톤 구현체.
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultantClientMappingHistoryServiceImpl implements ConsultantClientMappingHistoryService {

    private final ConsultantClientMappingHistoryRepository consultantClientMappingHistoryRepository;

    @Override
    @Transactional
    public ConsultantClientMappingHistory save(ConsultantClientMappingHistory entry) {
        return consultantClientMappingHistoryRepository.save(entry);
    }

    @Override
    @Transactional
    public ConsultantClientMappingHistory record(
            String tenantId,
            Long mappingId,
            Long clientId,
            Long consultantId,
            MappingHistoryEventType eventType,
            String beforeStateJson,
            String afterStateJson,
            Long triggeredByUserId,
            String reason) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — 매핑 lifecycle 게이트, partial-refund 트리거 등
        ConsultantClientMappingHistory entry = ConsultantClientMappingHistory.builder()
                .tenantId(tenantId)
                .mappingId(mappingId)
                .clientId(clientId)
                .consultantId(consultantId)
                .eventType(eventType)
                .beforeStateJson(beforeStateJson)
                .afterStateJson(afterStateJson)
                .triggeredByUserId(triggeredByUserId)
                .reason(reason)
                .build();
        return consultantClientMappingHistoryRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultantClientMappingHistory> findByTenantIdAndMappingId(
            String tenantId, Long mappingId, Pageable pageable) {
        return consultantClientMappingHistoryRepository
                .findByTenantIdAndMappingIdOrderByCreatedAtDesc(tenantId, mappingId, pageable);
    }
}
