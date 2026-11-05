package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkScheduleLink;
import org.springframework.stereotype.Repository;

/**
 * 타기관 연계 일정 연결 저장소.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Repository
public interface InstitutionLinkScheduleLinkRepository extends BaseRepository<InstitutionLinkScheduleLink, Long> {

    /**
     * 테넌트+일정 비삭제 단건.
     *
     * @param tenantId 테넌트 ID
     * @param scheduleId schedules.id
     * @return 연결
     */
    Optional<InstitutionLinkScheduleLink> findByTenantIdAndScheduleIdAndIsDeletedFalse(
            String tenantId, Long scheduleId);
}
