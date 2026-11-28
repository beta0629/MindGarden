package com.coresolution.consultation.security.pii;

/**
 * 단위 테스트 전용 HMAC 시크릿 (운영 비밀 아님).
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
public final class PiiTestSecrets {

    /** 테스트 전용 placeholder — 운영/공유 시크릿 금지. */
    public static final String HMAC_SECRET = "test-hmac-secret-not-for-production-use-only";

    private PiiTestSecrets() {
    }

    /**
     * 테스트용 {@link PiiHmacService}.
     *
     * @return HMAC 시크릿이 설정된 서비스
     */
    public static PiiHmacService hmacService() {
        return new PiiHmacService(HMAC_SECRET);
    }
}
