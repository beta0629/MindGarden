package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListQuery;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtendRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtensionItem;
import java.util.List;

/**
 * 어드민 온라인 주문 장부 — 목록(서버 page/size·세그먼트·요약), 사용 기한 판정, 기한 연장.
 *
 * <p>결제 승인·환불·ERP 는 다루지 않는다. 기한 연장은 이력 INSERT 만 한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public interface AdminShopOrderLedgerService {

    /**
     * 목록 한 페이지 + 세그먼트 건수 + 요약.
     *
     * @param tenantId 테넌트 ID
     * @param query    조회 조건
     * @return 목록 응답
     */
    ShopOrderAdminListResponse listOrders(String tenantId, ShopOrderAdminListQuery query);

    /**
     * 상세 응답에 내담자 이름·사용 기한·연장 이력을 채운다.
     *
     * @param tenantId 테넌트 ID
     * @param detail   기본 상세 (null 이면 그대로 반환)
     * @return 같은 객체
     */
    ShopOrderAdminDetailResponse enrichDetail(String tenantId, ShopOrderAdminDetailResponse detail);

    /**
     * 사용 기한 연장 — 이력 INSERT 만.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @param request       새 만료일·사유
     * @param actorUserId   처리자 users.id
     * @return 연장 반영 후 이력 (최신 먼저)
     * @throws IllegalArgumentException 주문 없음·검증 실패
     */
    List<ShopOrderExpiryExtensionItem> extendExpiry(
            String tenantId, String orderPublicId, ShopOrderExpiryExtendRequest request, Long actorUserId);

    /**
     * 연장 이력 (최신 먼저).
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 연장 이력
     * @throws IllegalArgumentException 주문 없음
     */
    List<ShopOrderExpiryExtensionItem> listExpiryExtensions(String tenantId, String orderPublicId);
}
