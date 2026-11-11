package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Schedule;

/**
 * 예약 일시(슬롯) 변경 후 새 슬롯 기준 D-1 리마인드 대상화 — 드래그·수정 모달·상담 재예약 공통.
 *
 * <p>D-1 리마인드 멱등 키는 (스케줄 + 시작 일시) 슬롯이므로 옛 슬롯 발송 이력은 새 슬롯을 막지 않는다.
 * 새 날짜가 D+2 이상이면 다음 09:00 배치({@code ReservationReminderScheduler})가 새 슬롯 D-1 을 보낸다.
 * 새 날짜가 내일(D-1)·오늘이면 그 날의 09:00 D-1/D-0 배치 기회가 이미 지났을 수 있으므로,
 * 등록 시점과 같은 규칙(업무시간 외 지연·슬롯 멱등)으로 새 슬롯 리마인드를 대상화한다.
 * 일정 변경 안내 문자(SCHEDULE_CHANGED)는 이 서비스가 보내지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
public interface ReservationReminderRescheduleService {

    /**
     * 슬롯 변경이 저장된 일정에 대해 새 슬롯 D-1 리마인드를 대상화한다 (비차단, 커밋 후 실행).
     *
     * @param tenantId 테넌트 ID (필수)
     * @param schedule 슬롯 변경 후 일정 (id·date·startTime 필수)
     */
    void onSlotChanged(String tenantId, Schedule schedule);
}
