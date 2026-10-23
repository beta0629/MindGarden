package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import org.springframework.stereotype.Repository;

/**
 * 타기관 연계 계약 저장소. 회기권 매핑 테이블을 조회하지 않는다.
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
     * 테넌트 활성 계약 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 최신 ID 순
     */
    List<InstitutionLinkContract> findByTenantIdAndIsDeletedFalseOrderByIdDesc(String tenantId);

    /**
     * 원 회기 매핑 ID 추적(신규 등록은 사용하지 않음).
     *
     * @param tenantId 테넌트 ID
     * @param sourceMappingId consultant_client_mappings.id
     * @return 계약
     */
    Optional<InstitutionLinkContract> findByTenantIdAndSourceMappingId(String tenantId, Long sourceMappingId);
}
