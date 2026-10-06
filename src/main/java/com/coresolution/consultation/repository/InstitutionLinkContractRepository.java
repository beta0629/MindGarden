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
     * 테넌트+상태 비삭제 계약 목록 (월청구 대상 ACTIVE).
     *
     * @param tenantId 테넌트 ID
     * @param status 계약 상태 코드
     * @return 최신 ID 순
     */
    List<InstitutionLinkContract> findByTenantIdAndStatusAndIsDeletedFalseOrderByIdDesc(
            String tenantId, String status);

    /**
     * 테넌트+내담자 비삭제 계약 목록.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 ID
     * @return 계약 목록
     */
    List<InstitutionLinkContract> findByTenantIdAndClientIdAndIsDeletedFalse(String tenantId, Long clientId);

    /**
     * 원 회기 매핑 ID 추적(신규 등록은 사용하지 않음).
     *
     * @param tenantId 테넌트 ID
     * @param sourceMappingId consultant_client_mappings.id
     * @return 계약
     */
    Optional<InstitutionLinkContract> findByTenantIdAndSourceMappingId(String tenantId, Long sourceMappingId);

    /**
     * 원 회기 매핑 ID 추적 (비삭제만).
     *
     * @param tenantId 테넌트 ID
     * @param sourceMappingId consultant_client_mappings.id
     * @return 계약
     */
    Optional<InstitutionLinkContract> findByTenantIdAndSourceMappingIdAndIsDeletedFalse(
            String tenantId, Long sourceMappingId);
}
