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
     * 가예약(TENTATIVE) 경로에서 매핑에 이미 점유 일정
     * (BOOKED/TENTATIVE_PENDING_PAYMENT/CONFIRMED/COMPLETED/IN_PROGRESS)이
     * 있고 remainingSessions &lt;= 0 일 때 재등록 거부.
     */
    public static final String MSG_PROVISIONAL_ALREADY_HAS_SCHEDULE =
            "이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.";

    /** 기관연계 배정은 가예약(TENTATIVE) 경로로 저장하지 않는다. */
    public static final String MSG_INSTITUTION_LINK_NOT_PROVISIONAL =
            "기관연계 일정은 가예약으로 등록할 수 없습니다.";

    /**
     * 같은 테넌트에서 연결 매칭을 찾을 수 없는 가예약 일정은 확정·점유 전환하지 않는다.
     * 결제 대기 매칭의 가예약 확정은 허용한다(회기 차감은 결제 후).
     */
    public static final String MSG_TENTATIVE_WITHOUT_MAPPING_CONFIRM_DENIED =
            "연결된 매칭을 찾을 수 없어 가예약 일정을 확정할 수 없습니다. 매칭을 확인한 뒤 다시 시도해 주세요.";

    /** 같은 테넌트에 없는 일정 id로 확정·당일 결제 대상을 지정한 경우. */
    public static final String MSG_SCHEDULE_NOT_FOUND = "일정을 찾을 수 없습니다.";

    private ScheduleServiceUserFacingMessages() {
    }
}
