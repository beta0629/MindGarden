package com.coresolution.consultation.constant;

/**
 * 상담사 상담 가능 시간(availability) API에서 사용자에게 노출하는 메시지.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
public final class ConsultantAvailabilityUserFacingMessages {

    /**
     * D-0·D-1(또는 null dayOfWeek) availability add/update fail-closed 거부.
     * 가능 시간은 Asia/Seoul 기준 오늘+{@link ConsultantAvailabilityConstants#AVAILABILITY_MIN_LEAD_DAYS}일부터 설정 가능.
     */
    public static final String MSG_AVAILABILITY_LEAD_DAYS_DENIED =
            "상담 가능 시간은 최소 2일 앞(오늘+2)부터 설정할 수 있습니다.";

    /**
     * D-0·D-1(또는 null vacationDate) 상담사 자가 휴가 등록 fail-closed 거부.
     * 휴가는 Asia/Seoul 기준 오늘+{@link ConsultantAvailabilityConstants#AVAILABILITY_MIN_LEAD_DAYS}일부터 등록 가능.
     * Admin/Staff 즉시 등록 우회는 서비스 계층에서 처리한다.
     */
    public static final String MSG_VACATION_LEAD_DAYS_DENIED =
            "휴가는 최소 2일 앞(오늘+2)부터 등록할 수 있습니다.";

    private ConsultantAvailabilityUserFacingMessages() {
    }
}
