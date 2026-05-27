package com.coresolution.consultation.repository;

import java.util.List;

import com.coresolution.consultation.entity.CommunityAnonymizationAudit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 커뮤니티 작성자 익명화 audit 저장소 — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Repository
public interface CommunityAnonymizationAuditRepository
        extends JpaRepository<CommunityAnonymizationAudit, Long> {

    /**
     * 테넌트 + 원작성자 기준 audit 행 조회 (오래된 순).
     *
     * @param tenantId       테넌트 ID
     * @param originalUserId 익명화 전 작성자 users.id
     * @return audit 행 목록
     */
    @Query("SELECT a FROM CommunityAnonymizationAudit a "
            + "WHERE a.tenantId = :tenantId AND a.originalUserId = :originalUserId "
            + "ORDER BY a.anonymizedAt ASC")
    List<CommunityAnonymizationAudit> findByTenantIdAndOriginalUserId(
            @Param("tenantId") String tenantId,
            @Param("originalUserId") Long originalUserId);

    /**
     * 테넌트 + 원작성자 기준 audit 행 개수.
     *
     * @param tenantId       테넌트 ID
     * @param originalUserId 익명화 전 작성자 users.id
     * @return audit 행 개수
     */
    @Query("SELECT COUNT(a) FROM CommunityAnonymizationAudit a "
            + "WHERE a.tenantId = :tenantId AND a.originalUserId = :originalUserId")
    long countByTenantIdAndOriginalUserId(
            @Param("tenantId") String tenantId,
            @Param("originalUserId") Long originalUserId);
}
