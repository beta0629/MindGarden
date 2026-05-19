package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
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

    /**
     * hold TTL 만료 대상: 미결제 상태이며 생성 시각이 cutoff 이전인 주문.
     *
     * @param tenantId 테넌트 ID
     * @param statuses 대상 상태 (CREATED, PENDING_PAYMENT)
     * @param cutoff   만료 기준 시각 (미만이면 만료)
     * @return 만료 처리 대상 주문
     */
    @Query("SELECT o FROM ShopClientOrder o WHERE o.tenantId = :tenantId AND o.isDeleted = false "
            + "AND o.status IN :statuses AND o.createdAt < :cutoff ORDER BY o.createdAt ASC")
    List<ShopClientOrder> findHoldExpiredOrders(
            @Param("tenantId") String tenantId,
            @Param("statuses") Collection<ShopClientOrderStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff);
}
