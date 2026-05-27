package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 컨설턴트-내담자 매핑 변경 이력 Service.
 *
 * <p>본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. 매핑 lifecycle / 회기 차감·복원 등의
 * 비즈니스 로직은 후속 위임에서 작성한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface ConsultantClientMappingHistoryService {

    ConsultantClientMappingHistory save(ConsultantClientMappingHistory entry);

    ConsultantClientMappingHistory record(
            String tenantId,
            Long mappingId,
            Long clientId,
            Long consultantId,
            MappingHistoryEventType eventType,
            String beforeStateJson,
            String afterStateJson,
            Long triggeredByUserId,
            String reason);

    Page<ConsultantClientMappingHistory> findByTenantIdAndMappingId(
            String tenantId, Long mappingId, Pageable pageable);
}
