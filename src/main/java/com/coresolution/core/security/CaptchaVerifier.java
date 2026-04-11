package com.coresolution.core.security;

/**
 * CAPTCHA(예: Cloudflare Turnstile) 토큰 검증.
 * 비활성화 시에는 구현체가 검증을 생략하고 {@code true}를 반환한다.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
public interface CaptchaVerifier {

    /**
     * 실제 원격 검증(Turnstile 등)이 켜진 경우 {@code true}. No-op 구현은 {@code false}.
     * 호출부에서 토큰 필수 여부를 판단할 때 사용한다.
     *
     * @return 클라이언트에 CAPTCHA 토큰 제출을 요구해야 하면 {@code true}
     */
    default boolean requiresCaptchaToken() {
        return false;
    }

    /**
     * 클라이언트가 제출한 토큰을 검증한다.
     *
     * @param token 클라이언트 응답 토큰(공급자별 필드명은 구현체에 따름)
     * @param remoteIp 선택적 클라이언트 IP(공급자가 요구할 때만 전달)
     * @return 검증 성공 또는 검증 생략(no-op)이면 {@code true}
     */
    boolean verify(String token, String remoteIp);
}
