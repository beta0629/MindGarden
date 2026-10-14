package com.coresolution.consultation.repository;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 내담자 전용 SKU 의 결제 완료 여부 조회 (기존 주문 리포지토리는 수정하지 않는다).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public interface ShopClientOfferPaidLookupRepository extends JpaRepository<ShopClientOrderLine, Long> {

    @Query("SELECT DISTINCT l.skuCodeSnapshot FROM ShopClientOrderLine l "
            + "WHERE l.tenantId = :tenantId AND l.isDeleted = false "
            + "AND l.clientOrder.clientId = :clientId AND l.clientOrder.status = :status "
            + "AND l.skuCodeSnapshot IN :skuCodes")
    List<String> findSkuCodesByClientAndStatus(
            @Param("tenantId") String tenantId,
            @Param("clientId") Long clientId,
            @Param("status") ShopClientOrderStatus status,
            @Param("skuCodes") Collection<String> skuCodes);
}
