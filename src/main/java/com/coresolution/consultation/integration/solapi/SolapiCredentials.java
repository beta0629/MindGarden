package com.coresolution.consultation.integration.solapi;

/**
 * 솔라피(Solapi/CoolSMS) API 자격 증명(키 본문은 메모리에만 보유한다).
 *
 * <p>DB·로그에 절대 출력하지 않는다. 로깅이 필요한 경우 keyRef/존재 여부만 기록한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
public record SolapiCredentials(String apiKey, String apiSecret) {

    /**
     * 두 값 모두 비어있지 않으면 {@code true}.
     *
     * @return 자격 증명이 사용 가능한지 여부
     */
    public boolean isComplete() {
        return apiKey != null && !apiKey.isBlank()
            && apiSecret != null && !apiSecret.isBlank();
    }
}
