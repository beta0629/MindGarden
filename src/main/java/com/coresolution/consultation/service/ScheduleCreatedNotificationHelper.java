package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Schedule;

/**
 * 일정 등록 시 인앱 메시지·예약 확정 푸시 발화(비차단, 별도 트랜잭션).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public interface ScheduleCreatedNotificationHelper {

    /**
     * BOOKED/CONFIRMED 일정에 대해 내담자·상담사 인앱 알림 및(선택) 푸시를 발송한다.
     * 실패 시 로그만 남기고 호출 트랜잭션에는 영향 없음.
     *
     * @param schedule 저장된 일정
     * @param includeMobilePush 내담자 booking_confirmed 푸시 포함 여부
     */
    void notifyScheduleCreated(Schedule schedule, boolean includeMobilePush);
}
