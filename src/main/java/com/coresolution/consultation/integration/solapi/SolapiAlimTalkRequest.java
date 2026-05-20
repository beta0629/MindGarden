package com.coresolution.consultation.integration.solapi;

import java.util.Map;

/**
 * 솔라피 알림톡(ATA) 단건 발송 요청 모델.
 *
 * <p>{@link SolapiAlimTalkClient}가 {@code POST /messages/v4/send-many/detail} 요청 본문을
 * 구성할 때 사용한다. {@code variables} 키는 카카오 비즈 템플릿의 {@code #{name}} 자리표시자에 매칭된다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
public record SolapiAlimTalkRequest(
        SolapiCredentials credentials,
        String pfId,
        String templateId,
        String fromNumber,
        String toNumber,
        Map<String, String> variables) {

    /**
     * 발송 가능한 최소 입력값이 모두 채워져 있는지 확인한다.
     *
     * @return 발신 프로필·템플릿·수신번호·자격 증명이 모두 있으면 {@code true}
     */
    public boolean isSendable() {
        return credentials != null && credentials.isComplete()
            && pfId != null && !pfId.isBlank()
            && templateId != null && !templateId.isBlank()
            && toNumber != null && !toNumber.isBlank();
    }
}
