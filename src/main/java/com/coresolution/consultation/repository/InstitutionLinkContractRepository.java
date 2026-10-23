package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import org.springframework.stereotype.Repository;

/**
 * 타기관 연계 계약 저장소.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Repository
public interface InstitutionLinkContractRepository extends BaseRepository<InstitutionLinkContract, Long> {

    /**
     * 테넌트+PK 비삭제 단건.
     *
     * @param tenantId 테넌트 ID
     * @param id 계약 ID
     * @return 계약
     */
    Optional<InstitutionLinkContract> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    /**
     * 마이그 추적: 원 회기 매핑 ID.
     *
     * @param tenantId 테넌트 ID
     * @param sourceMappingId consultant_client_mappings.id
     * @return 이전된 계약
     */
    Optional<InstitutionLinkContract> findByTenantIdAndSourceMappingId(String tenantId, Long sourceMappingId);
}
