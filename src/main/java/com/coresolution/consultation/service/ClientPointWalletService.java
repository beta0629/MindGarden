package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.dto.shop.ShopPointLedgerEntryResponse;
import java.util.List;

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
     * 최근 포인트 원장 N건 (createdAt DESC).
     *
     * @param tenantId 테넌트 ID
     * @param userId   사용자 ID
     * @param limit    조회 건수 (기본 20, 상한 100)
     * @return 원장 목록
     */
    List<ShopPointLedgerEntryResponse> listRecentLedger(String tenantId, Long userId, int limit);

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

    /**
     * PAID 확정 후 포인트 적립(EARN). 멱등 키 중복 시 no-op.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     적립 금액(원)
     * @param idempotencyKey  원장 멱등 키
     */
    void creditEarn(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);

    /**
     * PAID 환불 시 사용 확정(COMMIT) 역분개 — 가용 잔액 복원. 멱등 키 중복 시 no-op.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     복원 금액
     * @param idempotencyKey  원장 멱등 키
     */
    void restoreRedeemOnRefund(
            String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);

    /**
     * PAID 환불 시 적립(EARN) clawback — 잔액 부족 시 가용 0까지, 마이너스 금지. 멱등 키 중복 시 0 반환.
     *
     * @param tenantId        테넌트 ID
     * @param userId          사용자 ID
     * @param orderPublicId   주문 공개 ID
     * @param amountMinor     회수 대상 금액(적립액)
     * @param idempotencyKey  원장 멱등 키
     * @return 실제 회수된 포인트(원)
     */
    long clawbackEarn(String tenantId, Long userId, String orderPublicId, long amountMinor, String idempotencyKey);
}
