package com.coresolution.consultation.exception;

/**
 * 저장 프로시저가 {@code p_success=false} 를 돌려주거나 호출 자체가 실패했을 때 API 를 실패로 끝낸다.
 *
 * <p>{@link GlobalExceptionHandler} 가 {@code success:false} + {@link #getMessage()}(사용자용 한글 문구)로 응답한다.
 * 프로시저가 돌려준 메시지·SQL 예외 문구는 {@link #getDetail()} 로 서버 로그에만 남기고 응답에 넣지 않는다.
 * 생성은 {@link com.coresolution.consultation.util.ProcedureResults} 에서만 한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
public class ProcedureExecutionException extends RuntimeException {

    /** 응답 errorCode. */
    public static final String ERROR_CODE = "PROCEDURE_FAILED";

    private final String procedureName;

    private final String detail;

    /**
     * @param procedureName 프로시저 이름(로그용)
     * @param userMessage   사용자에게 보여 줄 한글 문구
     * @param detail        프로시저 메시지 또는 예외 문구(로그 전용, 응답 금지)
     * @param cause         원인 예외(없으면 {@code null})
     */
    public ProcedureExecutionException(String procedureName, String userMessage, String detail, Throwable cause) {
        super(userMessage, cause);
        this.procedureName = procedureName;
        this.detail = detail;
    }

    /**
     * @return 프로시저 이름
     */
    public String getProcedureName() {
        return procedureName;
    }

    /**
     * @return 로그 전용 상세(프로시저 메시지·SQL 예외 문구)
     */
    public String getDetail() {
        return detail;
    }
}
