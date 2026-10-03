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

    /** 날짜·시간 파싱 실패 (예: {@code ?startDate=bad}) */
    public static final String INVALID_DATE_FORMAT = "날짜 형식이 올바르지 않습니다. (예: 2026-01-31)";

    /** 요청 값을 대상 타입으로 변환하지 못함 */
    public static final String INVALID_PARAMETER_VALUE = "요청 값의 형식이 올바르지 않습니다.";

    /** 요청 바인딩 실패 (폼·쿼리 객체) */
    public static final String INVALID_REQUEST_BINDING = "요청 값을 처리하지 못했습니다. 입력값을 확인해 주세요.";

    public static final String CODE_INVALID_REQUEST_BODY = "INVALID_REQUEST_BODY";

    public static final String CODE_UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE";

    public static final String CODE_MISSING_REQUEST_PARAMETER = "MISSING_REQUEST_PARAMETER";

    public static final String CODE_INVALID_PARAMETER_TYPE = "INVALID_PARAMETER_TYPE";

    public static final String CODE_INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT";

    public static final String CODE_INVALID_PARAMETER_VALUE = "INVALID_PARAMETER_VALUE";

    public static final String CODE_INVALID_REQUEST_BINDING = "INVALID_REQUEST_BINDING";

    /**
     * 필드명을 덧붙인 사용자 문구. 예외 원문은 절대 넣지 않는다.
     *
     * @param baseMessage 기본 문구
     * @param field       요청 필드·파라미터 이름 (없으면 기본 문구 그대로)
     * @return 사용자 문구
     */
    public static String withField(String baseMessage, String field) {
        if (field == null || field.isBlank()) {
            return baseMessage;
        }
        return baseMessage + " (항목: " + field + ")";
    }

    private ApiRequestErrorMessages() {
        throw new UnsupportedOperationException("utility");
    }
}
