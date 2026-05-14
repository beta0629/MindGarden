package com.coresolution.consultation.service;

/**
 * 푸시 발송 멱등 청구(REQUIRES_NEW).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public interface MobilePushDispatchDedupService {

    /**
     * 멱등 행 삽입에 성공하면 true, 유니크 충돌 시 false.
     *
     * @param tenantId 테넌트 ID
     * @param pushType canonical type
     * @param entityId 비즈니스 엔티티 키
     * @param timeBucket 시간 창·슬롯
     * @return 신규 청구 여부
     */
    boolean tryClaim(String tenantId, String pushType, String entityId, String timeBucket);
}
