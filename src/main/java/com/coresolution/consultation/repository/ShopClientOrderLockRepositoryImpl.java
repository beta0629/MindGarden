package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ShopClientOrder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

/**
 * {@link ShopClientOrderLockRepository} 구현 (Spring Data 프래그먼트).
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public class ShopClientOrderLockRepositoryImpl implements ShopClientOrderLockRepository {

    private static final String LOCK_ORDER_JPQL = "SELECT o FROM ShopClientOrder o "
            + "WHERE o.tenantId = :tenantId AND o.publicId = :publicId AND o.isDeleted = false";

    private static final String LOCK_CLIENT_SQL =
            "SELECT u.id FROM users u WHERE u.tenant_id = :tenantId AND u.id = :clientUserId FOR UPDATE";

    private final EntityManager entityManager;

    public ShopClientOrderLockRepositoryImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Optional<ShopClientOrder> lockByTenantIdAndPublicId(String tenantId, String publicId) {
        if (tenantId == null || tenantId.isBlank() || publicId == null || publicId.isBlank()) {
            return Optional.empty();
        }
        List<ShopClientOrder> rows = entityManager.createQuery(LOCK_ORDER_JPQL, ShopClientOrder.class)
                .setParameter("tenantId", tenantId)
                .setParameter("publicId", publicId)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultList();
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        ShopClientOrder order = rows.get(0);
        // 이미 영속성 컨텍스트에 있던 엔티티는 쿼리 결과로 갱신되지 않는다 → 잠근 채 DB 값으로 다시 읽음
        entityManager.refresh(order, LockModeType.PESSIMISTIC_WRITE);
        return Optional.of(order);
    }

    @Override
    public void lockClientForCheckout(String tenantId, Long clientUserId) {
        if (tenantId == null || tenantId.isBlank() || clientUserId == null) {
            return;
        }
        entityManager.createNativeQuery(LOCK_CLIENT_SQL)
                .setParameter("tenantId", tenantId)
                .setParameter("clientUserId", clientUserId)
                .getResultList();
    }
}
