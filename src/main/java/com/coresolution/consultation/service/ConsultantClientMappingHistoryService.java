package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import java.util.Collection;
import java.util.List;
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

    /**
     * 배정 변경(IN/OUT) 이력을 매핑 ID 목록 기준으로 최신순 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingIds 매핑 ID 목록(비면 빈 목록)
     * @param eventTypes 이벤트 타입
     * @return 이력 목록
     */
    List<ConsultantClientMappingHistory> findByTenantIdAndMappingIdsAndEventTypes(
            String tenantId,
            Collection<Long> mappingIds,
            Collection<MappingHistoryEventType> eventTypes);
}
