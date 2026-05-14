package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.ShopCartReplaceRequest;
import com.coresolution.consultation.dto.shop.ShopCartResponse;

/**
 * 내담자 장바구니.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface ClientShopCartService {

    /**
     * 장바구니 조회 (서버 단가 기준 합계).
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @return 장바구니 응답
     */
    ShopCartResponse getCart(String tenantId, Long clientId);

    /**
     * 장바구니 라인 전체 교체.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @param request    라인 목록
     */
    void replaceCart(String tenantId, Long clientId, ShopCartReplaceRequest request);
}
