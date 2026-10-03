package com.coresolution.consultation.constant;

/**
 * HTTP 5xx 응답에 쓰는 사용자용 고정 문구.
 *
 * <p>예외 메시지(SQL·클래스명·스택 등)는 응답에 넣지 않고 로그에만 남긴다.
 * 응답에는 이 문구와 {@code traceId} 만 실어 로그와 대조할 수 있게 한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
public final class ServerErrorMessages {

    /** 5xx 공통 사용자 문구 */
    public static final String INTERNAL_SERVER_ERROR =
            "요청을 처리하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.";

    /** 컨트롤러 catch 블록 5xx 응답 오류 코드 */
    public static final String CODE_INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";

    private ServerErrorMessages() {
        throw new UnsupportedOperationException("utility");
    }
}
