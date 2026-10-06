package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import org.springframework.stereotype.Repository;

/**
 * 타기관 연계 상담일지 저장소.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Repository
public interface InstitutionLinkConsultationLogRepository
        extends BaseRepository<InstitutionLinkConsultationLog, Long> {

    /**
     * 테넌트+PK 비삭제 단건.
     *
     * @param tenantId 테넌트 ID
     * @param id 일지 ID
     * @return 일지
     */
    Optional<InstitutionLinkConsultationLog> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);
}
