package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * 주문 이행 이벤트 저장소.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Repository
public interface ShopOrderFulfillmentEventRepository extends BaseRepository<ShopOrderFulfillmentEvent, Long> {

    /**
     * 주문 단위 이행 멱등 여부 (이미 이벤트가 있으면 {@code orderPublicId:FULFILL} 재실행 스킵).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 존재 여부
     */
    boolean existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(String tenantId, String orderPublicId);

    /**
     * 주문별 이행 이벤트 목록 (SKU 코드 오름차순).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicId  주문 공개 ID
     * @return 이행 이벤트 목록
     */
    List<ShopOrderFulfillmentEvent> findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
            String tenantId, String orderPublicId);
}
