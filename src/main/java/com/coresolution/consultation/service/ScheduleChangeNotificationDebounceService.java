package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Schedule;

/**
 * 일정 변경 SCHEDULE_CHANGED 외부 채널 디바운스 서비스.
 *
 * <p>슬롯 변경 시 pending upsert 만 수행하고, fire_at 경과 후
 * {@link #processDuePending()} 가 최신 슬롯으로 1회 발송한다.
 * 모바일 푸시는 본 서비스 범위 밖(즉시 유지).</p>
 *
 * @author MindGarden
 * @since 2026-07-19
 */
public interface ScheduleChangeNotificationDebounceService {

    /**
     * 외부 채널 SCHEDULE_CHANGED 발송을 디바운스 pending 으로 등록(또는 fire_at 연장).
     *
     * @param tenantId      테넌트 ID
     * @param schedule      변경 후 스케줄 (id·date·start/end·clientId 필수)
     * @param previousDate  변경 전 일자
     * @param previousStart 변경 전 시작 시각
     */
    void enqueueScheduleChanged(
            String tenantId, Schedule schedule, LocalDate previousDate, LocalTime previousStart);

    /**
     * fire_at 경과 pending 을 처리하여 최신 슬롯으로 {@code sendScheduleChanged} 1회 발송.
     *
     * @return 처리(SENT/SKIP) 건수
     */
    int processDuePending();
}
