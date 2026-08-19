package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

/**
 * 예약 즉시 SMS 업무시간 외 지연 발송 서비스.
 *
 * <p>업무시간(기본 09:00~18:00 Asia/Seoul) 밖이면 pending enqueue,
 * fire_at 경과 후 등록 시점 템플릿으로 1회 발송한다.</p>
 *
 * @author MindGarden
 * @since 2026-07-29
 */
public interface ImmediateReservationSmsDeferralService {

    /**
     * 업무시간 외이면 지연 발송 시각을 반환. 업무시간 내이거나 기능 OFF 이면 empty(즉시 발송).
     *
     * @return 지연 fire_at 또는 empty
     */
    Optional<LocalDateTime> resolveDeferredFireAt();

    /**
     * 지연 발송 pending 등록(또는 동일 PENDING 의 fire_at 갱신).
     *
     * @param tenantId     테넌트 ID
     * @param scheduleId   스케줄 ID
     * @param templateCode {@link com.coresolution.consultation.constant.BatchNotificationTemplateCodes}
     * @param fireAt       발송 예정 시각 (Asia/Seoul LocalDateTime)
     */
    void enqueue(String tenantId, Long scheduleId, String templateCode, LocalDateTime fireAt);

    /**
     * fire_at 경과 PENDING 을 처리하여 예약 SMS 1회 발송.
     *
     * @return 처리(상태 전이) 건수
     */
    int processDuePending();

    /**
     * 스케줄의 D-2/D-1 PENDING 을 {@code SKIPPED_CANCELLED} 로 전이한다.
     *
     * <p>예약 일시(슬롯) 변경 시 옛 {@code fire_at} 이 당일 09:00 배치를 가로채지 않게 한다.
     * {@code templateCodes} 에 해당하는 PENDING 만 취소한다 ({@code RESERVATION_IMMEDIATE_SINGLE} 제외).
     * 즉시 디스패치는 수행하지 않는다.
     *
     * @param tenantId      테넌트 ID (필수)
     * @param scheduleId    스케줄 ID
     * @param templateCodes 취소 대상 템플릿 코드 (D2·LATE)
     * @return 취소(상태 전이) 건수
     * @author MindGarden
     * @since 2026-08-19
     */
    int cancelPendingReservationReminders(
            String tenantId, Long scheduleId, Collection<String> templateCodes);
}
