package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SelfAssessmentSubmission;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 자가검사 제출 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface SelfAssessmentSubmissionRepository extends BaseRepository<SelfAssessmentSubmission, Long> {

    @Query("SELECT s FROM SelfAssessmentSubmission s WHERE s.tenantId = :tenantId AND s.clientId = :clientId "
        + "AND s.isDeleted = false ORDER BY s.createdAt DESC")
    List<SelfAssessmentSubmission> findByTenantAndClientOrderByCreatedAtDesc(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId);

    @Query("SELECT s FROM SelfAssessmentSubmission s WHERE s.tenantId = :tenantId AND s.clientId = :clientId "
        + "AND s.id = :id AND s.isDeleted = false")
    Optional<SelfAssessmentSubmission> findByTenantClientAndId(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId,
        @Param("id") Long id);
}
