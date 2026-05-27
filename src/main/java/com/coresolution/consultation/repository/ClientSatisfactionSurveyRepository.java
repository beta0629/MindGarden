package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ClientSatisfactionSurvey;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link ClientSatisfactionSurvey} 리포지토리 — 내담자 만족도.
 *
 * <p>모든 조회 메서드는 {@code tenantId} 필터링 + {@code isDeleted=false} 가드 필수.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface ClientSatisfactionSurveyRepository extends JpaRepository<ClientSatisfactionSurvey, Long> {

    @Query("SELECT s FROM ClientSatisfactionSurvey s "
            + "WHERE s.tenantId = :tenantId "
            + "  AND s.consultantId = :consultantId "
            + "  AND s.isDeleted = false "
            + "ORDER BY s.submittedAt DESC")
    Page<ClientSatisfactionSurvey> findActiveByTenantIdAndConsultantId(
            @Param("tenantId") String tenantId,
            @Param("consultantId") Long consultantId,
            Pageable pageable);

    @Query("SELECT AVG(s.overallRating) FROM ClientSatisfactionSurvey s "
            + "WHERE s.tenantId = :tenantId "
            + "  AND s.consultantId = :consultantId "
            + "  AND s.isDeleted = false")
    Double averageOverallRating(
            @Param("tenantId") String tenantId,
            @Param("consultantId") Long consultantId);

    long countByTenantIdAndConsultantIdAndIsDeletedFalse(String tenantId, Long consultantId);
}
