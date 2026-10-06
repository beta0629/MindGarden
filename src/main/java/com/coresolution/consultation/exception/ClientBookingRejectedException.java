package com.coresolution.consultation.exception;

import org.springframework.http.HttpStatus;

/**
 * 내담자 직접 예약(가예약 신청)이 일정·매칭 규칙에 걸렸을 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 사유별 HTTP 상태와 errorCode 로 응답한다. 일정은 만들지 않는다.
 * 과거 시각은 {@link SchedulePastTimeException}({@code SCHEDULE_CREATE_IN_PAST}) 이 담당한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public class ClientBookingRejectedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * 거부 사유 — 응답 errorCode·message·HTTP 상태.
     */
    public enum Reason {
        /** 가예약을 허용하는 매칭(활성 또는 사후 카드 결제 대기)이 없음 */
        NO_ACTIVE_MAPPING("CLIENT_BOOKING_NO_ACTIVE_MAPPING",
                "예약할 수 있는 상담 매칭이 없습니다. 상담 센터에 문의해 주세요.", HttpStatus.CONFLICT),
        /** 상담사 휴무 */
        CONSULTANT_ON_VACATION("CLIENT_BOOKING_CONSULTANT_ON_VACATION",
                "선택한 시간은 상담사 휴무입니다. 다른 시간을 선택해 주세요.", HttpStatus.CONFLICT),
        /** 같은 상담사의 점유 일정과 겹침 */
        SLOT_CONFLICT("CLIENT_BOOKING_SLOT_CONFLICT",
                "선택한 시간에 이미 예약이 있습니다. 다른 시간을 선택해 주세요.", HttpStatus.CONFLICT),
        /** 공통 가예약 생성 규칙(기관연계·점유 중 가예약 등)에 걸림 — 메시지는 원 규칙 문구 */
        NOT_ALLOWED("CLIENT_BOOKING_NOT_ALLOWED",
                "지금은 예약을 신청할 수 없습니다. 상담 센터에 문의해 주세요.", HttpStatus.CONFLICT);

        private final String errorCode;
        private final String message;
        private final HttpStatus status;

        Reason(String errorCode, String message, HttpStatus status) {
            this.errorCode = errorCode;
            this.message = message;
            this.status = status;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getMessage() {
            return message;
        }

        public HttpStatus getStatus() {
            return status;
        }
    }

    private final Reason reason;

    /**
     * @param reason 거부 사유 (기본 문구 사용)
     */
    public ClientBookingRejectedException(Reason reason) {
        this(reason, reason.getMessage());
    }

    /**
     * @param reason  거부 사유
     * @param message 사용자 문구 (공통 규칙의 사용자 문구를 그대로 전달할 때)
     */
    public ClientBookingRejectedException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public Reason getReason() {
        return reason;
    }

    public String getErrorCode() {
        return reason.getErrorCode();
    }

    public HttpStatus getStatus() {
        return reason.getStatus();
    }
}
