package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.ShopCart;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 장바구니 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopCartRepository extends BaseRepository<ShopCart, Long> {

    @Query("SELECT c FROM ShopCart c WHERE c.tenantId = :tenantId AND c.clientId = :clientId AND c.isDeleted = false")
    Optional<ShopCart> findByTenantIdAndClientId(
            @Param("tenantId") String tenantId,
            @Param("clientId") Long clientId);
}
