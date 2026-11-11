package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceUpsertRequest;
import java.util.List;

/**
 * 어드민 SKU 이벤트 가격 기간 CRUD.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
public interface AdminShopCatalogSkuEventPriceService {

    /**
     * SKU 의 미삭제 이벤트 기간 목록.
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @return 시작일 오름차순 목록
     */
    List<ShopCatalogSkuEventPriceItem> list(String tenantId, Long skuId);

    /**
     * 이벤트 기간 생성.
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param request 요청
     * @return 저장 결과
     */
    ShopCatalogSkuEventPriceItem create(String tenantId, Long skuId, ShopCatalogSkuEventPriceUpsertRequest request);

    /**
     * 이벤트 기간 수정.
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param eventPriceId 이벤트 가격 ID
     * @param request 요청
     * @return 저장 결과
     */
    ShopCatalogSkuEventPriceItem update(
            String tenantId,
            Long skuId,
            Long eventPriceId,
            ShopCatalogSkuEventPriceUpsertRequest request);

    /**
     * 이벤트 기간 soft-delete.
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param eventPriceId 이벤트 가격 ID
     */
    void softDelete(String tenantId, Long skuId, Long eventPriceId);
}
