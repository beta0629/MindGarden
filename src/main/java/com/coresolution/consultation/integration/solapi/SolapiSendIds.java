package com.coresolution.consultation.integration.solapi;

/**
 * 직전 솔라피 알림톡 발송 호출의 식별자 묶음.
 *
 * <p>{@code KakaoAlimTalkService#consumeLastSolapiIds()} 를 통해 어드민 감사로그·운영 사후 추적에서
 * 발송 성공·실패와 무관하게 groupId/messageId 를 한 번 조회할 때 사용한다. 호출 스레드 단위
 * ({@link ThreadLocal}) 로 보존되며, consume 시점에 내부 상태는 clear 된다.
 *
 * @param groupId   솔라피 그룹 ID({@code groupInfo.groupId})
 * @param messageId 솔라피 메시지 ID({@code messageList[0].messageId})
 * @author MindGarden
 * @since 2026-05-22
 */
public record SolapiSendIds(String groupId, String messageId) {

    /**
     * groupId/messageId 가 모두 비어 있는지 여부.
     *
     * @return 둘 다 {@code null}/blank 면 true
     */
    public boolean isEmpty() {
        return (groupId == null || groupId.isBlank())
            && (messageId == null || messageId.isBlank());
    }
}
