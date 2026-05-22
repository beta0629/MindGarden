package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import java.time.LocalDate;
import java.time.LocalTime;

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
     * 예약 확정 푸시(내담자). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingConfirmed(String tenantId, Schedule schedule, Long actorUserId);

    /**
     * 예약 취소 푸시(내담자·상담사). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingCancelled(String tenantId, Schedule schedule, Long actorUserId);

    /**
     * 예약 일정 변경 푸시(내담자·상담사). actor(변경 주체) 본인은 수신 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 변경 후 일정(식별·수신자·신규 슬롯)
     * @param previousDate 변경 전 일자
     * @param previousStart 변경 전 시작 시각
     * @param previousEnd 변경 전 종료 시각
     * @param actorUserId 변경 주체(현재 로그인 사용자) PK. null이면 actor 가드 미적용.
     */
    void dispatchBookingRescheduled(
            String tenantId,
            Schedule schedule,
            LocalDate previousDate,
            LocalTime previousStart,
            LocalTime previousEnd,
            Long actorUserId);

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

    /**
     * 마음 날씨 카드 공유 푸시(담당 상담사).
     *
     * @param tenantId 테넌트 ID
     * @param cardId 카드 PK
     * @param consultantUserId 수신 상담사 users.id
     * @param clientDisplayName 푸시 본문용 내담자 표시명
     * @param summarySnippet 요약 일부(선택)
     */
    void dispatchMindWeatherShared(
            String tenantId,
            Long cardId,
            Long consultantUserId,
            String clientDisplayName,
            String summarySnippet);

    void dispatchMoodJournalShared(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String clientDisplayName,
            String journalDate,
            String emoji,
            String memoSnippet);

    /**
     * 어드민 매칭 정산(결제·입금·승인) 푸시. PG {@code Payment} 발송과 분리·멱등 버킷 사용.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 PK
     * @param clientUserId 내담자 users.id
     * @param consultantUserId 상담사 users.id
     * @param includeConsultant 상담사 푸시 포함 여부(승인 시 true)
     * @param canonicalType {@link com.coresolution.consultation.constant.MobilePushCanonicalTypes}
     * @param dedupeBucket 멱등 버킷(시나리오별 고정)
     * @param title 알림 제목
     * @param clientBody 내담자 알림 본문
     * @param consultantBody 상담사 알림 본문({@code includeConsultant}일 때만 사용, null이면 {@code clientBody}와 동일)
     */
    void dispatchMappingSettlement(
            String tenantId,
            Long mappingId,
            Long clientUserId,
            Long consultantUserId,
            boolean includeConsultant,
            String canonicalType,
            String dedupeBucket,
            String title,
            String clientBody,
            String consultantBody);

    /**
     * 쇼핑몰 주문 PAID 확정 푸시(내담자).
     *
     * @param tenantId 테넌트 ID
     * @param clientUserId 내담자 users.id
     * @param orderPublicId 주문 public ID
     * @param totalPaidMinor 결제 합계(원, minor)
     */
    void dispatchShopOrderPaid(String tenantId, Long clientUserId, String orderPublicId, long totalPaidMinor);

    /**
     * 쇼핑몰 PG 결제 실패 푸시(내담자).
     */
    void dispatchShopPaymentFailed(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * 구매 적립 포인트 푸시(내담자).
     */
    void dispatchPointEarned(String tenantId, Long clientUserId, String orderPublicId, long earnAmountMinor);

    /**
     * 쇼핑몰 hold TTL 만료 푸시(내담자).
     */
    void dispatchShopOrderHoldExpired(String tenantId, Long clientUserId, String orderPublicId);

    /**
     * 쇼핑몰 전액 환불 푸시(내담자).
     */
    void dispatchShopOrderRefunded(String tenantId, Long clientUserId, String orderPublicId, long refundAmountMinor);

    /**
     * CONSULTATION fulfillment COMPLETED 푸시(내담자·선택 상담사).
     */
    void dispatchShopFulfillmentCompleted(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String orderPublicId,
            String skuCode);
}
