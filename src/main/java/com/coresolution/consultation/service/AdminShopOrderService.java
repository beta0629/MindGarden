package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import java.util.List;

/**
 * 테넌트 어드민 — 온라인 주문 조회.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminShopOrderService {

    /**
     * 테넌트 최근 주문 목록.
     *
     * @param tenantId 테넌트 ID
     * @param limit    최대 건수 (상한 적용)
     * @return 목록 (최신순)
     */
    List<ShopOrderAdminSummaryItem> listRecentOrders(String tenantId, int limit);

    /**
     * 주문 상세(라인·이행 이벤트 요약).
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 상세
     */
    ShopOrderAdminDetailResponse getOrderDetail(String tenantId, String orderPublicId);
}
