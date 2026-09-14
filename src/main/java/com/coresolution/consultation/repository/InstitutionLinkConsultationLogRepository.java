package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * 스케줄 단위 타기관 일지 존재 — schedule id only SSOT.
     *
     * <p>{@code isSessionCompleted} 는 강제하지 않는다(레코드 존재면 true).
     * 회기권 {@code ConsultationRecordRepository#existsActiveForScheduleSsot} 와 동일 계약.</p>
     *
     * @param tenantId 테넌트 ID
     * @param scheduleId 일정 ID ({@code schedules.id})
     * @return 일지 존재 여부
     * @author CoreSolution
     * @since 2026-09-14
     */
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END "
            + "FROM InstitutionLinkConsultationLog l "
            + "WHERE l.tenantId = :tenantId "
            + "  AND l.isDeleted = false "
            + "  AND l.scheduleId = :scheduleId")
    boolean existsActiveForScheduleSsot(
            @Param("tenantId") String tenantId,
            @Param("scheduleId") Long scheduleId);

    /**
     * 테넌트+PK 비삭제 단건.
     *
     * @param tenantId 테넌트 ID
     * @param id 일지 ID
     * @return 일지
     */
    Optional<InstitutionLinkConsultationLog> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    /**
     * 스케줄 기준 최신 비삭제 일지. 재오픈 로드용.
     *
     * @param tenantId 테넌트 ID
     * @param scheduleId 스케줄 ID
     * @return 최신 일지
     */
    Optional<InstitutionLinkConsultationLog> findFirstByTenantIdAndScheduleIdAndIsDeletedFalseOrderByIdDesc(
            String tenantId,
            Long scheduleId);

    /**
     * 매핑 기준 최신 비삭제 일지. scheduleId 없을 때 폴백.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @return 최신 일지
     */
    Optional<InstitutionLinkConsultationLog> findFirstByTenantIdAndMappingIdAndIsDeletedFalseOrderByIdDesc(
            String tenantId,
            Long mappingId);

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
