package com.coresolution.consultation.constant;

/**
 * 세션 보안 플래그 키 SSOT ({@code system_config} 테넌트 스코프).
 *
 * <p>중복 로그인(동시 다중 세션) 허용 여부는 테넌트 단위로 관리한다.
 * 테넌트 ADMIN 이 {@code /admin/system-config} 에서 자기 테넌트만 토글한다.
 *
 * <p>우선순위:
 * <ol>
 *   <li>테넌트 {@code system_config} 행 ({@code tenant_id}, {@link #DUPLICATE_LOGIN_ALLOWED})</li>
 *   <li>행 없음 → env {@code session.duplicate-login-check.allowed-by-default}
 *       (미설정 시 {@link #DEFAULT_ALLOWED} = {@code false})</li>
 * </ol>
 *
 * <p>전역 체크 동작(모달/자동종료)은 env {@code session.duplicate-login-check.enabled} /
 * {@code session.duplicate-login-check.ask-user-confirmation} 가 담당하며,
 * 본 키는 “동시 접속 허용 여부”만 오버라이드한다.
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

    /** {@code system_config.category} — 어드민 UI 그룹핑. */
    public static final String CATEGORY = "SECURITY";

    /**
     * 테넌트 행·env 모두 없을 때 폴백.
     *
     * <p>운영 안전: 명시적 허용이 없으면 동시 다중 세션 불가.
     */
    public static final boolean DEFAULT_ALLOWED = false;

    private SessionSecurityFlagKeys() {
    }
}
