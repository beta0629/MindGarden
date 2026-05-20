package com.coresolution.consultation.integration.solapi;

/**
 * 솔라피 알림톡 단건 발송 결과.
 *
 * <p>실제 응답 본문은 비공개 정보(messageId 등)를 포함할 수 있으므로 디버깅이 필요할 때만 로깅한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
public record SolapiAlimTalkResponse(
        boolean success,
        int statusCode,
        String messageId,
        String errorCode,
        String errorMessage) {

    /**
     * 정상 응답을 생성한다.
     *
     * @param messageId 솔라피 messageId
     * @return success=true 응답
     */
    public static SolapiAlimTalkResponse success(String messageId) {
        return new SolapiAlimTalkResponse(true, 200, messageId, null, null);
    }

    /**
     * 실패 응답을 생성한다.
     *
     * @param statusCode HTTP 상태 코드
     * @param errorCode  솔라피 errorCode
     * @param errorMessage 사람이 읽을 메시지(키 본문 포함 금지)
     * @return success=false 응답
     */
    public static SolapiAlimTalkResponse failure(int statusCode, String errorCode, String errorMessage) {
        return new SolapiAlimTalkResponse(false, statusCode, null, errorCode, errorMessage);
    }
}
