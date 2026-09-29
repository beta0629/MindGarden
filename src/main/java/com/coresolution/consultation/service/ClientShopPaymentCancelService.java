package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.ShopUserCancelPaymentResponse;

/**
 * 내담자가 결제창을 닫았을 때(사용자 취소) 미결제 주문 정리.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public interface ClientShopPaymentCancelService {

    /**
     * 주문이 미결제이고 PortOne 조회가 PAID 가 아님이 확인될 때만 주문·결제 건을 CANCELLED 로 닫는다 (멱등).
     * PortOne 이 PAID 이면 아무것도 바꾸지 않는다. PG 취소 API 는 호출하지 않는다.
     *
     * @param tenantId       테넌트 ID
     * @param clientUserId   내담자 users.id
     * @param orderPublicId  주문 공개 ID
     * @return 처리 결과
     * @throws IllegalArgumentException 주문 없음
     * @throws com.coresolution.consultation.exception.ForbiddenException 본인 주문 아님
     */
    ShopUserCancelPaymentResponse cancelByUser(String tenantId, Long clientUserId, String orderPublicId);
}
