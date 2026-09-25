package com.coresolution.consultation.constant;

/**
 * 요청 파싱·파라미터 오류용 고정 클라이언트 메시지.
 *
 * <p>파서/Jackson 내부 메시지는 로그에만 남기고 응답에는 노출하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-25
 */
public final class ApiRequestErrorMessages {

    /** malformed JSON 등 요청 본문 파싱 실패 */
    public static final String INVALID_REQUEST_BODY = "요청 본문 형식이 올바르지 않습니다.";

    /** 지원하지 않는 Content-Type */
    public static final String UNSUPPORTED_MEDIA_TYPE = "지원하지 않는 Content-Type입니다.";

    /** 필수 쿼리/폼 파라미터 누락 */
    public static final String MISSING_REQUEST_PARAMETER = "필수 요청 파라미터가 누락되었습니다.";

    /** 파라미터 타입 불일치 */
    public static final String INVALID_PARAMETER_TYPE = "요청 파라미터 형식이 올바르지 않습니다.";

    public static final String CODE_INVALID_REQUEST_BODY = "INVALID_REQUEST_BODY";

    public static final String CODE_UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE";

    public static final String CODE_MISSING_REQUEST_PARAMETER = "MISSING_REQUEST_PARAMETER";

    public static final String CODE_INVALID_PARAMETER_TYPE = "INVALID_PARAMETER_TYPE";

    private ApiRequestErrorMessages() {
        throw new UnsupportedOperationException("utility");
    }
}
