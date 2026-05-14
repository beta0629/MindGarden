package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;

/**
 * Expo Push API를 통한 모바일 OS 푸시 발송(토큰·설정 게이트·멱등·무효 토큰 비활성).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public interface MobilePushDispatchService {

    /**
     * 예약 리마인더 푸시(내담자·상담사).
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param body 알림 본문(짧게)
     * @param reminderSlotCode 멱등·로그용 슬롯(예: T60, T30)
     */
    void dispatchBookingReminder(String tenantId, Schedule schedule, String body, String reminderSlotCode);

    /**
     * 예약 확정 푸시(내담자).
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     */
    void dispatchBookingConfirmed(String tenantId, Schedule schedule);

    /**
     * 예약 취소 푸시(내담자·상담사).
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     */
    void dispatchBookingCancelled(String tenantId, Schedule schedule);

    /**
     * 결제 완료 푸시(결제자).
     *
     * @param tenantId 테넌트 ID
     * @param payment 결제
     */
    void dispatchPaymentCompleted(String tenantId, Payment payment);

    /**
     * 결제 실패 푸시(결제자).
     *
     * @param tenantId 테넌트 ID
     * @param payment 결제
     */
    void dispatchPaymentFailed(String tenantId, Payment payment);

    /**
     * 회기 소진 임박 푸시(내담자).
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 PK
     * @param clientUserId 내담자 사용자 PK
     * @param remainingSessions 남은 회기 수
     */
    void dispatchSessionLow(String tenantId, Long mappingId, Long clientUserId, int remainingSessions);
}
