package com.coresolution.core.security;

/**
 * CAPTCHA 비활성화·시크릿 미설정 시 사용. 항상 검증 성공으로 처리한다.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
public final class NoOpCaptchaVerifier implements CaptchaVerifier {

    @Override
    public boolean verify(String token, String remoteIp) {
        return true;
    }
}
