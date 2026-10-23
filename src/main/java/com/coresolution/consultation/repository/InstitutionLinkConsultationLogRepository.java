package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import org.springframework.stereotype.Repository;

/**
 * 타기관 연계 상담일지 저장소. {@code consultation_records} 를 조회하지 않는다.
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

    /**
     * 매핑+청구월 건수. 월 회차 채번에 사용한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param billingYearMonth 청구 연월
     * @return 건수
     */
    long countByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalse(
            String tenantId,
            Long mappingId,
            String billingYearMonth);

    /**
     * 계약+청구월 건수. 월 회차 채번에 사용한다.
     *
     * @param tenantId 테넌트 ID
     * @param contractId 계약 ID
     * @param billingYearMonth 청구 연월
     * @return 건수
     */
    long countByTenantIdAndContractIdAndBillingYearMonthAndIsDeletedFalse(
            String tenantId,
            Long contractId,
            String billingYearMonth);

    /**
     * 매핑+청구월 월말 내역.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param billingYearMonth 청구 연월
     * @return 일자·ID 오름차순
     */
    List<InstitutionLinkConsultationLog>
            findByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalseOrderBySessionDateAscIdAsc(
                    String tenantId,
                    Long mappingId,
                    String billingYearMonth);

    /**
     * 계약+청구월 월말 내역.
     *
     * @param tenantId 테넌트 ID
     * @param contractId 계약 ID
     * @param billingYearMonth 청구 연월
     * @return 일자·ID 오름차순
     */
    List<InstitutionLinkConsultationLog>
            findByTenantIdAndContractIdAndBillingYearMonthAndIsDeletedFalseOrderBySessionDateAscIdAsc(
                    String tenantId,
                    Long contractId,
                    String billingYearMonth);
}
