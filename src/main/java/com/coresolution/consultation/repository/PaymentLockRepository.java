package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.Payment;

/**
 * 결제 행 비관적 락 재조회 — {@link PaymentRepository} 커스텀 프래그먼트.
 * <p>주문 행을 먼저 잠근 뒤(주문 → 결제 순서) 같은 트랜잭션에서 이미 읽어 둔 결제 엔티티를
 * 최신 커밋 값으로 다시 읽는다. 반드시 트랜잭션 안에서 호출한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public interface PaymentLockRepository {

    /**
     * 결제 엔티티를 {@code PESSIMISTIC_WRITE} 로 잠그고 DB 값으로 갱신한다.
     *
     * @param payment 영속 상태의 결제 엔티티 (null 이거나 비영속이면 무시)
     */
    void refreshWithLock(Payment payment);
}
