package com.coresolution.core.constants;

/**
 * PG 웹훅 시크릿 저장 API 의 사용자 노출 문구.
 * 시크릿 평문은 메시지·로그·응답에 넣지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-15
 */
public final class TenantPgWebhookSecretMessages {

    private TenantPgWebhookSecretMessages() {
    }

    /**
     * {@code whsec_} + 표준 Base64 가 아닐 때. 입력 원문을 포함하지 않는다.
     */
    public static final String INVALID_FORMAT =
            "웹훅 시크릿은 whsec_ 로 시작하는 올바른 Base64 값이어야 합니다.";
}
