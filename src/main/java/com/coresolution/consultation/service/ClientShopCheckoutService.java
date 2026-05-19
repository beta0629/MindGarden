package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopOrderSummaryResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentResponse;

/**
 * 내담자 체크아웃·주문·PG intent.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface ClientShopCheckoutService {

    /**
     * 장바구니 기준 체크아웃(주문 생성·포인트 hold·전액 포인트 시 PAID).
     *
     * @param tenantId      테넌트 ID
     * @param clientUserId  내담자 users.id
     * @param request       멱등 키·포인트
     * @return 체크아웃 결과
     */
    ShopCheckoutResponse checkout(String tenantId, Long clientUserId, ShopCheckoutRequest request);

    /**
     * 현금 청구분 PG 결제 레코드 생성(멱등: 기존 PENDING 재사용).
     *
     * @param tenantId       테넌트 ID
     * @param clientUserId   내담자 users.id
     * @param orderPublicId  주문 공개 ID
     * @param request        결제 수단(선택)
     * @return 결제 응답
     */
    ShopPreparePaymentResponse preparePayment(
            String tenantId,
            Long clientUserId,
            String orderPublicId,
            ShopPreparePaymentRequest request);

    /**
     * 결제 전 주문 취소(포인트 hold 해제).
     *
     * @param tenantId       테넌트 ID
     * @param clientUserId   내담자 users.id
     * @param orderPublicId  주문 공개 ID
     */
    void cancelOrder(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * 내 주문 목록.
     *
     * @param tenantId      테넌트 ID
     * @param clientUserId  내담자 users.id
     * @param page          페이지 (0-base)
     * @param size          크기
     * @return 목록
     */
    List<ShopOrderSummaryResponse> listMyOrders(String tenantId, Long clientUserId, int page, int size);

    /**
     * 주문 상세(라인 스냅샷).
     *
     * @param tenantId       테넌트 ID
     * @param clientUserId   내담자 users.id
     * @param orderPublicId  주문 공개 ID
     * @return 상세
     */
    ShopOrderResponse getOrder(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * PG 결제 승인 시 주문을 {@code PAID}로 전이하고 포인트 hold를 commit 한다 (멱등).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID ({@link com.coresolution.consultation.entity.Payment#getOrderId()} 와 동일)
     * @return 해당 테넌트에 쇼핑 주문이 있으면 {@code true}, 없으면 {@code false}
     */
    boolean completeOrderOnPaymentApproved(String tenantId, String orderPublicId);

    /**
     * PG 결제 실패·취소 시 포인트 hold를 해제한다 (멱등). {@code PENDING_PAYMENT}는 {@code CREATED}로 되돌린다.
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 해당 테넌트에 쇼핑 주문이 있으면 {@code true}, 없으면 {@code false}
     */
    boolean releaseOrderHoldOnPaymentFailure(String tenantId, String orderPublicId);

    /**
     * hold TTL 만료 시 포인트 hold를 해제하고 주문을 {@code EXPIRED}로 전이한다 (멱등).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 이번 호출에서 {@code EXPIRED}로 전이했으면 {@code true}, 주문 없음·이미 종료 상태면 {@code false}
     */
    boolean expireOrderHold(String tenantId, String orderPublicId);
}
