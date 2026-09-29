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
     * 노출 중인 카탈로그 SKU 목록. 게스트용이며 매핑 필터를 적용하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @return SKU 목록
     */
    List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId);

    /**
     * 로그인 내담자에게 보이는 카탈로그.
     * <p>CONSULTATION 은 활성 매핑과 분야·패키지명이 맞는 행만,
     * ASSESSMENT 는 테넌트 노출 행을 유지한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return SKU 목록
     */
    List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId, Long clientUserId);

    /**
     * 노출 중인 단일 SKU (PDP). 게스트용이며 매핑 필터를 적용하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param skuCode SKU 코드
     * @return SKU
     */
    ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode);

    /**
     * 로그인 내담자에게 보이는 단일 SKU. 숨긴 SKU 는 없는 것과 같다.
     *
     * @param tenantId 테넌트 ID
     * @param skuCode SKU 코드
     * @param clientUserId 내담자 사용자 ID
     * @return SKU
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 없거나 이 내담자에게 숨긴 SKU
     */
    ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode, Long clientUserId);
}
