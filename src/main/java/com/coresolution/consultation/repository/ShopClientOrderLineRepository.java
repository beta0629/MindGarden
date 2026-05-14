package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import org.springframework.stereotype.Repository;

/**
 * 주문 라인 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopClientOrderLineRepository extends BaseRepository<ShopClientOrderLine, Long> {

    List<ShopClientOrderLine> findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(Long clientOrderId);
}
