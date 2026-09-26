package com.coresolution.consultation.constant;

/**
 * 세션 보안 플래그 키 SSOT ({@code system_config} 테넌트·전역 스코프).
 *
 * <p>중복 로그인(동시 다중 세션) 허용 여부와 OAuth/팬텀 세션 완화 스위치를 테넌트 단위로 관리한다.
 * 테넌트 ADMIN 이 {@code /admin/system-config} 에서 자기 테넌트만 토글한다.
 *
 * <p>우선순위:
 * <ol>
 *   <li>테넌트 {@code system_config} 행 ({@code tenant_id}, 키)</li>
 *   <li>전역 행 ({@code tenant_id=''})</li>
 *   <li>키별 DEFAULT 상수</li>
 * </ol>
 *
 * <p>캐시 TTL: {@link #CACHE_TTL_MS} — 재시작 없이 DB 토글 반영.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
public final class SessionSecurityFlagKeys {

    /**
     * 테넌트별 중복 로그인(동시 다중 세션) 허용 여부.
     *
     * <p>{@code true} → {@code checkDuplicateLogin} 스킵·동시 접속 가능.
     * {@code false} → 기존 중복 체크·모달/자동종료 유지.
     */
    public static final String DUPLICATE_LOGIN_ALLOWED =
            "security.session.duplicate-login.allowed";

    /**
     * OAuth 웹 로그인 후 {@code current-user} foreground 200 전에는 FE {@code isLoggedIn} 확정 금지.
     * 기본 {@code true} — 팬텀 SNS 세션 차단.
     */
    public static final String OAUTH_REQUIRE_SERVER_VERIFY =
            "security.session.oauth.require-server-verify";

    /**
     * background {@code checkSession} 401 시 FE user 유지 여부.
     * 기본 {@code false} — 팬텀 로그인 유지 방지(운영 권장).
     */
    public static final String BACKGROUND_401_KEEP_USER =
            "security.session.background-401.keep-user";

    /**
     * shell chrome soft-fail(브랜딩·LNB 등) 401 시 /login 킥 스킵 여부.
     * 기본 {@code true}. 회기·샵 API 로 확대하지 않는다.
     */
    public static final String SOFT_FAIL_ENABLED =
            "security.session.soft-fail.enabled";

    /** {@code system_config.category} — 어드민 UI 그룹핑. */
    public static final String CATEGORY = "SECURITY";

    /**
     * 테넌트 행·env 모두 없을 때 중복 로그인 허용 폴백.
     *
     * <p>운영 안전: 명시적 허용이 없으면 동시 다중 세션 불가.
     */
    public static final boolean DEFAULT_ALLOWED = false;

    /** OAuth 서버 검증 필수 기본값. */
    public static final boolean DEFAULT_OAUTH_REQUIRE_SERVER_VERIFY = true;

    /** background 401 keep-user 기본값(팬텀 방지). */
    public static final boolean DEFAULT_BACKGROUND_401_KEEP_USER = false;

    /** soft-fail 기본값(기존 LNB soft-fail 유지). */
    public static final boolean DEFAULT_SOFT_FAIL_ENABLED = true;

    /**
     * 세션 보안 플래그 인메모리 캐시 TTL(ms).
     * 어드민 토글 후 최대 이 시간 내 재시작 없이 반영.
     */
    public static final long CACHE_TTL_MS = 30_000L;

    private SessionSecurityFlagKeys() {
    }
}
