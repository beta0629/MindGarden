package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 상품 구성 저장 요청. 단가·회기·합계는 서버가 다시 계산하므로 받지 않는다.
 *
 * @param items 구성 항목 (순서대로 sort_order 부여)
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopPackageCompositionSaveRequest(@Valid List<Item> items) {

    /**
     * 구성 항목 한 줄.
     *
     * @param skuId shop_catalog_skus.id
     * @param quantity 수량 (1 이상)
     */
    public record Item(@NotNull Long skuId, Integer quantity) {
    }
}
