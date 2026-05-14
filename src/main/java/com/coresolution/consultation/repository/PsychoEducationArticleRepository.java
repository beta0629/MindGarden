package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.PsychoEducationArticle;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 심리교육 마스터 Repository.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Repository
public interface PsychoEducationArticleRepository extends JpaRepository<PsychoEducationArticle, Long> {

    List<PsychoEducationArticle> findByTenantIdAndIsDeletedFalseAndPublishedTrueOrderBySortOrderAscIdAsc(
        String tenantId);

    List<PsychoEducationArticle> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(String tenantId);

    Optional<PsychoEducationArticle> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    boolean existsByTenantIdAndSlugAndIsDeletedFalse(String tenantId, String slug);

    boolean existsByTenantIdAndSlugAndIsDeletedFalseAndIdNot(String tenantId, String slug, Long id);
}
