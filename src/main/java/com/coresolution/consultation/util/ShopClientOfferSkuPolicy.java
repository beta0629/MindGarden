package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.entity.ShopCatalogSku;

/**
 * 내담자 전용 SKU 판별 (관리자 상품·SKU 목록 제외 기준의 단일 정의).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public final class ShopClientOfferSkuPolicy {

    private ShopClientOfferSkuPolicy() {
    }

    /**
     * 코드 접두어가 OFFER_ 이고 몰 비노출인 SKU 만 내담자 전용으로 본다.
     *
     * @param sku 카탈로그 SKU
     * @return 내담자 전용이면 true
     */
    public static boolean isClientOfferSku(ShopCatalogSku sku) {
        return sku != null
                && sku.getSkuCode() != null
                && sku.getSkuCode().startsWith(ShopClientOfferConstants.SKU_CODE_PREFIX)
                && !Boolean.TRUE.equals(sku.getCatalogVisible());
    }
}
