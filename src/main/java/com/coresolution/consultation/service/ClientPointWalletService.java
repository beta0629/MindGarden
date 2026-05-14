package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;

/**
 * 내담자 포인트 지갑 (hold·release·commit).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public interface ClientPointWalletService {

    /**
     * 가용·예약 잔액 조회.
     *
     * @param tenantId 테넌트 ID
     * @param userId   사용자 ID
     * @return 잔액 DTO
     */
    ShopPointBalanceResponse getBalance(String tenantId, Long userId);

    /**
     * 체크아웃 포인트 예약(hold). 멱등 키 중복 시 no-op.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     예약 금액(원)
     * @param idempotencyKey  원장 멱등 키
     */
    void hold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);

    /**
     * hold 해제(취소·실패). 멱등 키 중복 시 no-op.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     해제 금액
     * @param idempotencyKey  원장 멱등 키
     */
    void releaseHold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);

    /**
     * hold 확정 차감(PAID). 멱등 키 중복 시 no-op.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     확정 금액
     * @param idempotencyKey  원장 멱등 키
     */
    void commitHold(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);
}
