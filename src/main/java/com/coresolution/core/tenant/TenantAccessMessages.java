package com.coresolution.core.tenant;

/**
 * 정지·종료 테넌트 접근 차단 응답 상수.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class TenantAccessMessages {

    /** HTTP 상태. */
    public static final int DENY_HTTP_STATUS = 403;

    /** 응답 errorCode. */
    public static final String DENY_CODE = "TENANT_ACCESS_DENIED";

    /** 사용자에게 보여주는 문구. 로그인·리프레시·필터가 같은 문구를 쓴다. */
    public static final String DENY_MESSAGE = "정지 또는 종료된 테넌트는 이용할 수 없습니다.";

    /** Ops 콘솔 API 접두. 이 경로는 상태와 무관하게 허용한다. */
    public static final String OPS_PATH_PREFIX = "/api/v1/ops";

    private TenantAccessMessages() {
    }
}
