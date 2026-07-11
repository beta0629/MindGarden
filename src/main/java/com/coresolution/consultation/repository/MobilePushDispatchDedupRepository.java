package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushDispatchDedup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 푸시 발송 멱등 저장소.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Repository
public interface MobilePushDispatchDedupRepository extends JpaRepository<MobilePushDispatchDedup, Long> {

    /**
     * 멱등 키 존재 여부.
     *
     * @param tenantId 테넌트 ID
     * @param pushType canonical type
     * @param entityId 비즈니스 엔티티 키
     * @param timeBucket 시간 창·슬롯
     * @return 이미 청구된 경우 true
     */
    boolean existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
            String tenantId, String pushType, String entityId, String timeBucket);
}
