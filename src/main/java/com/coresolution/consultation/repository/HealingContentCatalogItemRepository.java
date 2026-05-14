package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.HealingContentCatalogItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 힐링 카탈로그 마스터 Repository.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Repository
public interface HealingContentCatalogItemRepository extends JpaRepository<HealingContentCatalogItem, Long> {

    List<HealingContentCatalogItem> findByTenantIdAndIsDeletedFalseAndPublishedTrueOrderBySortOrderAscIdAsc(
        String tenantId);

    List<HealingContentCatalogItem> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(String tenantId);

    Optional<HealingContentCatalogItem> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    boolean existsByTenantIdAndCodeAndIsDeletedFalse(String tenantId, String code);

    boolean existsByTenantIdAndCodeAndIsDeletedFalseAndIdNot(String tenantId, String code, Long id);
}
