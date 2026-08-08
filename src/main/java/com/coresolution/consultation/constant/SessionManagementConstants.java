package com.coresolution.consultation.constant;

/**
 * 세션 관리 관련 상수
 * 중복 로그인 방지 시스템용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
public final class SessionManagementConstants {
    
    private SessionManagementConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    // ===== 세션 관리 상수 =====
    
    /**
     * 기본 세션 타임아웃 (분).
     * SSOT: {@code HTTP_SESSION_MAX_INACTIVE} / {@code server.servlet.session.timeout} (기본 4h=240분).
     * SessionConstants.SESSION_TIMEOUT_SECONDS(4h)와 정합.
     * 웹 HttpSession용 — Access JWT(jwt.expiration=1h)와 별개(세션 4h ≠ JWT 1h).
     */
    public static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 240;
    
    /**
     * 운영 환경 최대 동시 세션 수 (사용자당) — 레거시 참고값.
     *
     * <p>실효 중복 로그인 정책 SSOT 는 테넌트
     * {@link SessionSecurityFlagKeys#DUPLICATE_LOGIN_ALLOWED} + {@code AuthServiceImpl}.
     * Spring {@code maximumSessions} 는 테넌트 허용과 충돌하지 않도록
     * {@link #MAX_CONCURRENT_SESSIONS_SPRING_CEILING} 을 사용한다.
     * 문서: {@code docs/standards/SECURITY_STANDARD.md}.
     */
    public static final int MAX_CONCURRENT_SESSIONS_PRODUCTION = 1;

    /**
     * 개발·로컬 등 비운영 환경 최대 동시 세션 수 (사용자당) — 레거시 참고값.
     */
    public static final int MAX_CONCURRENT_SESSIONS_DEVELOPMENT = 3;

    /**
     * Spring ConcurrentSession 상한 (-1 = 무제한).
     *
     * <p>테넌트 {@code duplicate-login.allowed=true} 시 Spring 층이 동시 접속을 막지 않도록
     * 완화한다. 불가(deny) 정책은 애플리케이션 계층({@code checkDuplicateLogin})이 강제한다.
     */
    public static final int MAX_CONCURRENT_SESSIONS_SPRING_CEILING = -1;

    /**
     * 테넌트 중복 로그인 허용 시 Spring ConcurrentSession 상한 (-1 = 무제한).
     */
    public static final int MAX_CONCURRENT_SESSIONS_WHEN_DUPLICATE_ALLOWED = -1;

    /**
     * 최대 동시 세션 수 (사용자당) — 비운영 기본값.
     * 환경별 분기는 {@link #MAX_CONCURRENT_SESSIONS_PRODUCTION} /
     * {@link #MAX_CONCURRENT_SESSIONS_DEVELOPMENT} 를 사용한다.
     */
    public static final int MAX_CONCURRENT_SESSIONS = MAX_CONCURRENT_SESSIONS_DEVELOPMENT;
    
    /**
     * 세션 만료 체크 간격 (분)
     */
    public static final int SESSION_CLEANUP_INTERVAL_MINUTES = 5;
    
    /**
     * 세션 연장 가능 시간 (분)
     */
    public static final int SESSION_EXTENSION_MINUTES = 15;
    
    // ===== 로그인 타입 상수 =====
    
    /**
     * 일반 로그인
     */
    public static final String LOGIN_TYPE_NORMAL = "NORMAL";
    
    /**
     * 소셜 로그인
     */
    public static final String LOGIN_TYPE_SOCIAL = "SOCIAL";
    
    // ===== 세션 종료 사유 상수 =====
    
    /**
     * 중복 로그인으로 인한 세션 종료
     */
    public static final String END_REASON_DUPLICATE_LOGIN = "DUPLICATE_LOGIN";
    
    /**
     * 세션 만료로 인한 종료
     */
    public static final String END_REASON_EXPIRED = "EXPIRED";
    
    /**
     * 사용자 로그아웃
     */
    public static final String END_REASON_LOGOUT = "LOGOUT";
    
    /**
     * 관리자에 의한 강제 종료
     */
    public static final String END_REASON_ADMIN_FORCE = "ADMIN_FORCE";

    /**
     * 사용자가 중복 로그인 모달에서 기존 세션 종료를 확인
     */
    public static final String END_REASON_USER_CONFIRMED_TERMINATE = "USER_CONFIRMED_TERMINATE";
    
    /**
     * 시스템 오류로 인한 종료
     */
    public static final String END_REASON_SYSTEM_ERROR = "SYSTEM_ERROR";
    
    // ===== 중복 로그인 방지 정책 =====
    
    /**
     * 중복 로그인 허용 여부 — 레거시 상수.
     *
     * <p>실효 SSOT: {@link SessionSecurityFlagKeys#DUPLICATE_LOGIN_ALLOWED} (테넌트 DB)
     * + env {@code session.duplicate-login-check.allowed-by-default}.
     * 본 필드는 하위 호환용이며 신규 분기에 사용하지 않는다.
     */
    public static final boolean ALLOW_DUPLICATE_LOGIN = true;
    
    /**
     * 중복 로그인 시 기존 세션 종료 여부
     */
    public static final boolean TERMINATE_EXISTING_SESSION = true;
    
    /**
     * 중복 로그인 알림 표시 여부
     */
    public static final boolean SHOW_DUPLICATE_LOGIN_ALERT = true;
    
    // ===== 세션 보안 상수 =====
    
    /**
     * Access JWT iat 와 {@code users.last_login_at} 비교 시 허용 오차(초).
     * 로그인 응답에서 토큰 발급 후 lastLoginAt 갱신 순서·시계 오차로 인한 오탐 방지.
     */
    public static final long ACCESS_TOKEN_LAST_LOGIN_GRACE_SECONDS = 30L;

    /**
     * 세션 ID 최소 길이
     */
    public static final int MIN_SESSION_ID_LENGTH = 32;
    
    /**
     * 세션 ID 최대 길이
     */
    public static final int MAX_SESSION_ID_LENGTH = 100;
    
    /**
     * 의심스러운 활동 감지 임계값 (같은 IP에서의 세션 수)
     */
    public static final int SUSPICIOUS_ACTIVITY_THRESHOLD = 5;
    
    // ===== 에러 메시지 상수 =====
    
    /**
     * 중복 로그인 사용자 확인 프롬프트 메시지
     * AuthServiceImpl#authenticateWithSession 에서 ask-user-confirmation 활성 시 사용
     */
    public static final String DUPLICATE_LOGIN_MESSAGE = "다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?";

    /**
     * 폴링 API({@code /check-duplicate-login}) — 타 세션 감지 메시지
     */
    public static final String DUPLICATE_LOGIN_DETECTED_POLL_MESSAGE = "다른 곳에서 로그인되어 있습니다.";

    /**
     * 폴링 API — 중복 없음 메시지
     */
    public static final String NO_DUPLICATE_LOGIN_MESSAGE = "중복 로그인이 없습니다.";
    
    /**
     * 세션 만료 메시지
     */
    public static final String SESSION_EXPIRED_MESSAGE = "세션이 만료되었습니다. 다시 로그인해주세요.";
    
    /**
     * 세션 종료 알림 메시지
     */
    public static final String SESSION_TERMINATED_MESSAGE = "다른 곳에서 로그인하여 현재 세션이 종료되었습니다.";
    
    /**
     * 최대 세션 수 초과 메시지
     */
    public static final String MAX_SESSION_EXCEEDED_MESSAGE = "최대 동시 세션 수를 초과했습니다.";
}
