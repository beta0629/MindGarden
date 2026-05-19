package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuPriceHistoryItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import java.util.List;

/**
 * 어드민 카탈로그 SKU CRUD·노출.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminShopCatalogSkuService {

    List<ShopCatalogSkuAdminItem> listAllForTenant(String tenantId);

    ShopCatalogSkuAdminDetail getForAdmin(String tenantId, Long id);

    ShopCatalogSkuAdminDetail create(String tenantId, ShopCatalogSkuUpsertRequest request);

    ShopCatalogSkuAdminDetail update(String tenantId, Long id, ShopCatalogSkuUpsertRequest request);

    void patchCatalogVisible(String tenantId, Long id, boolean catalogVisible);

    /**
     * SKU 단가 변경 이력(최근 N건).
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param limit 최대 건수
     * @return 변경 이력(최신순)
     */
    List<ShopCatalogSkuPriceHistoryItem> listPriceHistory(String tenantId, Long skuId, int limit);
}
