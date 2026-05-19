package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;

/**
 * 내담자 카탈로그 조회.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface ClientShopCatalogService {

    /**
     * 노출 중인 카탈로그 SKU 목록.
     *
     * @param tenantId 테넌트 ID
     * @return SKU 목록
     */
    List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId);

    /**
     * 노출 중인 단일 SKU (PDP).
     *
     * @param tenantId 테넌트 ID
     * @param skuCode SKU 코드
     * @return SKU
     */
    ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode);
}
