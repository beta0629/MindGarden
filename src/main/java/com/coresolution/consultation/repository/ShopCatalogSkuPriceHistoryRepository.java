package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopCatalogSkuPriceHistory;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * SKU 단가 변경 이력 저장소.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
@Repository
public interface ShopCatalogSkuPriceHistoryRepository extends BaseRepository<ShopCatalogSkuPriceHistory, Long> {

    List<ShopCatalogSkuPriceHistory> findByTenantIdAndSkuIdAndIsDeletedFalseOrderByChangedAtDescIdDesc(
            String tenantId,
            Long skuId,
            Pageable pageable);
}
