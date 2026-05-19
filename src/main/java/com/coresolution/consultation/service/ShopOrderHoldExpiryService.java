package com.coresolution.consultation.service;

/**
 * 미결제 쇼핑 주문 hold TTL 만료 배치.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface ShopOrderHoldExpiryService {

    /**
     * 단일 테넌트의 hold TTL 만료 주문을 처리한다.
     *
     * @param tenantId 테넌트 ID
     * @return EXPIRED로 전이한 주문 수
     */
    int expireStaleHoldsForTenant(String tenantId);

    /**
     * 활성 테넌트 전체에 대해 hold TTL 만료를 처리한다.
     *
     * @return EXPIRED로 전이한 주문 수 합계
     */
    int expireStaleHoldsForAllActiveTenants();
}
