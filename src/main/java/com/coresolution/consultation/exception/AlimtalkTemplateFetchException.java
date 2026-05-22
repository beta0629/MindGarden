package com.coresolution.consultation.exception;

/**
 * 어드민 테스트 발송 도구에서 솔라피 실시간 알림톡 템플릿 조회가
 * 외부 호출(자격증명·HTTP 4xx/5xx·응답 파싱)에서 실패했을 때 발생.
 *
 * <p>{@link GlobalExceptionHandler}에서 HTTP 502 Bad Gateway + {@code ALIMTALK_TEMPLATE_FETCH_FAILED}
 * 코드와 함께 어드민 응답으로 노출되어 진단을 가속한다. 빈 리스트만 반환하면
 * 프론트는 "템플릿 없음"으로 표시되어 실제 원인(자격증명·잘못된 요청 등)을 파악할 수 없다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
public class AlimtalkTemplateFetchException extends RuntimeException {

    /** 외부(예: 솔라피)에서 받은 HTTP 상태 코드 또는 0(통신 실패). */
    private final int upstreamStatus;

    /** 외부 응답에서 추출한 errorCode(없으면 {@code null}). */
    private final String upstreamErrorCode;

    /**
     * @param upstreamStatus     솔라피 응답 상태 코드(0이면 클라이언트 측 실패)
     * @param upstreamErrorCode  솔라피 응답 errorCode(없으면 {@code null})
     * @param message            사람이 읽기 좋은 메시지(이미 마스킹된 본문 포함 권장)
     */
    public AlimtalkTemplateFetchException(int upstreamStatus, String upstreamErrorCode, String message) {
        super(message);
        this.upstreamStatus = upstreamStatus;
        this.upstreamErrorCode = upstreamErrorCode;
    }

    /**
     * @return 솔라피 응답 상태 코드(또는 0)
     */
    public int getUpstreamStatus() {
        return upstreamStatus;
    }

    /**
     * @return 솔라피 응답 errorCode(없으면 {@code null})
     */
    public String getUpstreamErrorCode() {
        return upstreamErrorCode;
    }
}
