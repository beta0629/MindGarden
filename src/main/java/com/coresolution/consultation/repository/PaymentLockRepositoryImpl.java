package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.Payment;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

/**
 * {@link PaymentLockRepository} 구현 (Spring Data 프래그먼트).
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public class PaymentLockRepositoryImpl implements PaymentLockRepository {

    private final EntityManager entityManager;

    public PaymentLockRepositoryImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public void refreshWithLock(Payment payment) {
        if (payment == null || !entityManager.contains(payment)) {
            return;
        }
        entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);
    }
}
