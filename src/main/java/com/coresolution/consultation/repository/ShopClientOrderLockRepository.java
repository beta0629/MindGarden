package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑 주문 비관적 락(SELECT … FOR UPDATE) 조회 — {@link ShopClientOrderRepository} 커스텀 프래그먼트.
 * <p>사용자 취소·결제 승인·늦은 결제 환불·체크아웃 재사용 판정이 같은 주문(또는 같은 내담자)을 동시에
 * 바꾸지 못하게 직렬화한다. 반드시 트랜잭션 안에서 호출한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public interface ShopClientOrderLockRepository {

    /**
     * 주문 행을 {@code PESSIMISTIC_WRITE} 로 잠그고 최신 커밋 값으로 반환한다.
     * 같은 트랜잭션에서 이미 읽어 둔 엔티티가 있어도 잠근 뒤 DB 값으로 다시 읽는다.
     *
     * @param tenantId 테넌트 ID
     * @param publicId 주문 공개 ID
     * @return 잠긴 주문 (없으면 empty)
     */
    Optional<ShopClientOrder> lockByTenantIdAndPublicId(String tenantId, String publicId);

    /**
     * 체크아웃 직렬화용으로 내담자 사용자 행을 잠근다 (주문이 아직 없을 때 동시 체크아웃이 주문 2건을 만들지 않게).
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 users.id
     */
    void lockClientForCheckout(String tenantId, Long clientUserId);
}
