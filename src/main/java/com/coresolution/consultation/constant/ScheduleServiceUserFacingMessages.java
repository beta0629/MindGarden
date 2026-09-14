package com.coresolution.consultation.constant;

/**
 * {@code ScheduleService}·스케줄 API에서 사용자에게 노출하는 메시지.
 *
 * @author CoreSolution
 * @since 2026-08-25
 */
public final class ScheduleServiceUserFacingMessages {

    /** 완료(COMPLETED) 스케줄의 date/startTime/endTime 변경 거부 */
    public static final String MSG_COMPLETED_SLOT_CHANGE_DENIED =
            "완료된 스케줄은 일시를 변경할 수 없습니다.";

    /** 취소(CANCELLED) 스케줄의 date/startTime/endTime 변경 거부 */
    public static final String MSG_CANCELLED_SLOT_CHANGE_DENIED =
            "취소된 스케줄은 일시를 변경할 수 없습니다.";

    /** 과거 스케줄(날짜가 오늘 이전, 또는 당일이지만 종료 시각이 지남)의 슬롯 변경 거부 */
    public static final String MSG_PAST_SLOT_CHANGE_DENIED =
            "과거 스케줄은 일시를 변경할 수 없습니다.";

    /**
     * 레거시: 가예약 경로에서 매핑 점유 일정 유무로 재등록을 거부하던 메시지.
     * 제품 정책 변경으로 createConsultantSchedule 에서는 더 이상 throw 하지 않음
     * (SAME_DAY_CARD/가예약은 복수 일정·월말 결제 허용). 동일 슬롯 충돌은 별도 가드.
     */
    public static final String MSG_PROVISIONAL_ALREADY_HAS_SCHEDULE =
            "이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.";

    private ScheduleServiceUserFacingMessages() {
    }
}
