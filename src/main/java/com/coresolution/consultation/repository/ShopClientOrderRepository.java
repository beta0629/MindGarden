package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ShopClientOrder;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 내담자 온라인 주문 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopClientOrderRepository extends BaseRepository<ShopClientOrder, Long> {

    @Query("SELECT o FROM ShopClientOrder o WHERE o.tenantId = :tenantId AND o.publicId = :publicId AND o.isDeleted = false")
    Optional<ShopClientOrder> findByTenantIdAndPublicId(
            @Param("tenantId") String tenantId,
            @Param("publicId") String publicId);

    @Query("SELECT o FROM ShopClientOrder o WHERE o.tenantId = :tenantId AND o.clientId = :clientId "
            + "AND o.checkoutIdempotencyKey = :key AND o.isDeleted = false")
    Optional<ShopClientOrder> findByTenantClientAndCheckoutKey(
            @Param("tenantId") String tenantId,
            @Param("clientId") Long clientId,
            @Param("key") String key);

    @Query("SELECT o FROM ShopClientOrder o WHERE o.tenantId = :tenantId AND o.clientId = :clientId "
            + "AND o.isDeleted = false ORDER BY o.createdAt DESC")
    List<ShopClientOrder> findRecentByTenantAndClient(
            @Param("tenantId") String tenantId,
            @Param("clientId") Long clientId,
            Pageable pageable);

    @Query("SELECT o FROM ShopClientOrder o WHERE o.tenantId = :tenantId AND o.isDeleted = false "
            + "ORDER BY o.createdAt DESC")
    List<ShopClientOrder> findRecentByTenant(
            @Param("tenantId") String tenantId,
            Pageable pageable);
}
