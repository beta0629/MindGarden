package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
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
}
