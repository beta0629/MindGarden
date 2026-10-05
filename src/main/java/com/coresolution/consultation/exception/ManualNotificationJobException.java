package com.coresolution.consultation.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 수동 발송 작업 요청 거부(상한 초과·대상 변경·대상 없음 등). 컨트롤러가 상태·errorCode 로 응답한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Getter
public class ManualNotificationJobException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String errorCode;
    private final HttpStatus status;

    /**
     * @param errorCode 오류 코드
     * @param status    HTTP 상태
     * @param message   사용자 메시지
     */
    public ManualNotificationJobException(String errorCode, HttpStatus status, String message) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
