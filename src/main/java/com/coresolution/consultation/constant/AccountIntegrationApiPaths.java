package com.coresolution.consultation.constant;

/**
 * 계정 연동 API 경로 SSOT. 컨트롤러·보안 설정·레이트리밋 접두가 모두 이 값을 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public final class AccountIntegrationApiPaths {

    public static final String BASE = "/api/v1/accounts/integration";
    public static final String SEND_VERIFICATION_CODE = "/send-verification-code";
    public static final String VERIFY_CODE = "/verify-code";
    public static final String INTEGRATE = "/integrate";
    public static final String STATUS = "/status";
    public static final String LINK_SOCIAL = "/link-social";

    /** 로그인 전(SNS 계정 통합 진행 중)에 호출되어 permitAll 인 POST 경로 */
    public static final String PUBLIC_SEND_VERIFICATION_CODE = BASE + SEND_VERIFICATION_CODE;
    public static final String PUBLIC_VERIFY_CODE = BASE + VERIFY_CODE;
    public static final String PUBLIC_INTEGRATE = BASE + INTEGRATE;

    /** 요청 접두(레이트리밋 기본값) */
    public static final String BASE_PREFIX = BASE + "/";

    private AccountIntegrationApiPaths() {
    }
}
