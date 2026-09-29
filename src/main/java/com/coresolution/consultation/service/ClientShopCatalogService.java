package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;

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

    /**
     * 로그인 내담자 카탈로그 노출 규칙과 같은 조건으로 SKU 가 보이는지 판단한다.
     * <p>체크아웃에서 상담 상품 구매 가능 여부를 재검사할 때 쓴다.
     * 활성 매핑이 없으면 false.</p>
     *
     * @param tenantId 테넌트 ID
     * @param sku 카탈로그 SKU
     * @param activeMappings 같은 테넌트 내담자의 활성 매핑
     * @return 보이면 true
     */
    boolean isVisibleForClientMappings(
            String tenantId, ShopCatalogSku sku, List<ConsultantClientMapping> activeMappings);
}
