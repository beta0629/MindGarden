package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.entity.ShopCatalogSku;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ShopClientOfferSkuPolicy")
class ShopClientOfferSkuPolicyTest {

    private static ShopCatalogSku sku(String code, boolean visible) {
        ShopCatalogSku s = new ShopCatalogSku();
        s.setSkuCode(code);
        s.setCatalogVisible(visible);
        return s;
    }

    @Test
    @DisplayName("접두어 + 비노출만 내담자 전용")
    void policy() {
        assertTrue(ShopClientOfferSkuPolicy.isClientOfferSku(sku("OFFER_AB", false)));
        assertFalse(ShopClientOfferSkuPolicy.isClientOfferSku(sku("OFFER_AB", true)));
        assertFalse(ShopClientOfferSkuPolicy.isClientOfferSku(sku("LEGACY-1", false)));
        assertFalse(ShopClientOfferSkuPolicy.isClientOfferSku(null));
    }
}
