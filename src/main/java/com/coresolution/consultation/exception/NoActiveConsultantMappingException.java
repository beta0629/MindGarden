package com.coresolution.consultation.exception;

/**
 * 내담자 본인이 마음 날씨·무드 저널 등을 상담사에게 공유하려 할 때, 활성 매핑이 없는 경우 발생.
 *
 * <p>FE 사전 가드 보조: 사전 조회로 차단되지 않은 경계 케이스(매칭 동시 INACTIVE 변경 등)에서
 * BE 가 비즈니스 코드 {@code NO_ACTIVE_CONSULTANT_MAPPING} 으로 응답해 FE 가 안내 모달을 띄울 수 있게 한다.</p>
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 400 + JSON 본문
 * {@code { success:false, code:"NO_ACTIVE_CONSULTANT_MAPPING", message:"..." }} 으로 매핑한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public class NoActiveConsultantMappingException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 비즈니스 에러 코드 — FE 분기에 사용. */
    public static final String ERROR_CODE = "NO_ACTIVE_CONSULTANT_MAPPING";

    private final String errorCode;

    /**
     * 사용자 친화적 메시지로 예외 발생.
     *
     * @param message 토스트·모달에 노출 가능한 한글 메시지
     */
    public NoActiveConsultantMappingException(String message) {
        super(message);
        this.errorCode = ERROR_CODE;
    }

    /**
     * @return 비즈니스 에러 코드 ({@code NO_ACTIVE_CONSULTANT_MAPPING})
     */
    public String getErrorCode() {
        return errorCode;
    }
}
