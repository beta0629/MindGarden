package com.coresolution.consultation.integration.solapi;

/**
 * 솔라피 알림톡 단건 발송 결과.
 *
 * <p>실제 응답 본문은 비공개 정보(messageId 등)를 포함할 수 있으므로 디버깅이 필요할 때만 로깅한다.
 *
 * <p>{@code POST /messages/v4/send-many/detail} 응답은 그룹 단위 {@code groupInfo.groupId}와
 * 메시지 단위 {@code messageList[].messageId}를 함께 반환한다. 두 식별자는 사후 추적(콘솔 확인,
 * 운영 사고 분석) 용도로 모두 필요하므로 별도 필드로 보존한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
public record SolapiAlimTalkResponse(
        boolean success,
        int statusCode,
        String groupId,
        String messageId,
        String errorCode,
        String errorMessage) {

    /**
     * 정상 응답을 생성한다.
     *
     * @param messageId 솔라피 messageId (또는 groupId 폴백)
     * @return success=true 응답
     */
    public static SolapiAlimTalkResponse success(String messageId) {
        return new SolapiAlimTalkResponse(true, 200, messageId, messageId, null, null);
    }

    /**
     * 정상 응답을 생성한다(groupId/messageId 명시).
     *
     * @param groupId   솔라피 그룹 ID (콘솔 추적용)
     * @param messageId 솔라피 메시지 ID
     * @return success=true 응답
     */
    public static SolapiAlimTalkResponse success(String groupId, String messageId) {
        return new SolapiAlimTalkResponse(true, 200, groupId, messageId, null, null);
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
        return new SolapiAlimTalkResponse(false, statusCode, null, null, errorCode, errorMessage);
    }

    /**
     * 실패 응답을 생성한다(groupId/messageId 보존).
     *
     * <p>Solapi가 reject 응답에도 groupId/messageId를 반환하는 경우, 사후 콘솔 추적·운영 사고 분석을
     * 위해 식별자를 보존한다. 호출자는 {@link #success()} 가 {@code false} 임을 확인 후
     * 별도 로그·감사로그에 식별자를 기록할 수 있다.
     *
     * @param statusCode   HTTP 상태 코드
     * @param groupId      솔라피 그룹 ID (있으면 보존)
     * @param messageId    솔라피 메시지 ID (있으면 보존)
     * @param errorCode    솔라피 errorCode (또는 messageList[].statusCode)
     * @param errorMessage 사람이 읽을 메시지(키 본문 포함 금지)
     * @return success=false 응답
     */
    public static SolapiAlimTalkResponse failure(int statusCode, String groupId, String messageId,
            String errorCode, String errorMessage) {
        return new SolapiAlimTalkResponse(false, statusCode, groupId, messageId, errorCode, errorMessage);
    }
}
