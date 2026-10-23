package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.PartnerInstitution;
import org.springframework.stereotype.Repository;

/**
 * 연계 기관 마스터 저장소.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Repository
public interface PartnerInstitutionRepository extends BaseRepository<PartnerInstitution, Long> {

    /**
     * 테넌트 활성 기관 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 이름순 기관
     */
    List<PartnerInstitution> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    /**
     * 테넌트+PK 비삭제 단건.
     *
     * @param tenantId 테넌트 ID
     * @param id 기관 ID
     * @return 기관
     */
    Optional<PartnerInstitution> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);
}
