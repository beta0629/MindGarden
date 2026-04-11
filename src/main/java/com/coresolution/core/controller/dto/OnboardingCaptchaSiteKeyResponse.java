package com.coresolution.core.controller.dto;

/**
 * 공개 온보딩 CAPTCHA(Turnstile) 위젯용 설정. 시크릿 키는 포함하지 않는다.
 *
 * @param enabled Turnstile 실검증 경로가 활성화된 경우 {@code true} (비활성·시크릿 미설정 시 {@code false})
 * @param siteKey 클라이언트 위젯용 site key; 비활성이거나 미설정이면 {@code null}
 * @author CoreSolution
 * @since 2026-04-11
 */
public record OnboardingCaptchaSiteKeyResponse(boolean enabled, String siteKey) {
}
