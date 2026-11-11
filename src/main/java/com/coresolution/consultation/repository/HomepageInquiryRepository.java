package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.HomepageInquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 홈페이지 문의 Repository.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public interface HomepageInquiryRepository extends JpaRepository<HomepageInquiry, Long> {

    /**
     * 테넌트·상태(선택) 목록. 삭제되지 않은 행만.
     *
     * @param tenantId 테넌트 ID
     * @param status   상태 필터(null 이면 전체)
     * @param pageable 페이지
     * @return 페이지
     */
    @Query("""
            SELECT h FROM HomepageInquiry h
            WHERE h.tenantId = :tenantId
              AND h.isDeleted = false
              AND (:status IS NULL OR h.status = :status)
            ORDER BY h.createdAt DESC
            """)
    Page<HomepageInquiry> findByTenantIdAndOptionalStatus(
            @Param("tenantId") String tenantId,
            @Param("status") String status,
            Pageable pageable);

    /**
     * 테넌트 스코프 단건 조회.
     *
     * @param tenantId 테넌트 ID
     * @param id       PK
     * @return Optional
     */
    @Query("""
            SELECT h FROM HomepageInquiry h
            WHERE h.tenantId = :tenantId
              AND h.id = :id
              AND h.isDeleted = false
            """)
    Optional<HomepageInquiry> findByTenantIdAndIdAndNotDeleted(
            @Param("tenantId") String tenantId,
            @Param("id") Long id);

    /**
     * 신규(NEW) 건수 — 사이드바 뱃지용.
     *
     * @param tenantId 테넌트 ID
     * @param status   상태 코드
     * @return 건수
     */
    long countByTenantIdAndStatusAndIsDeletedFalse(String tenantId, String status);
}
