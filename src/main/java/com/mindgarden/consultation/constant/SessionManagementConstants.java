package com.mindgarden.consultation.constant;

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
     * 기본 세션 타임아웃 (분)
     */
    public static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
    
    /**
     * 최대 동시 세션 수 (사용자당)
     */
    public static final int MAX_CONCURRENT_SESSIONS = 1;
    
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
     * 시스템 오류로 인한 종료
     */
    public static final String END_REASON_SYSTEM_ERROR = "SYSTEM_ERROR";
    
    // ===== 중복 로그인 방지 정책 =====
    
    /**
     * 중복 로그인 허용 여부
     */
    public static final boolean ALLOW_DUPLICATE_LOGIN = false;
    
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
     * 중복 로그인 감지 메시지
     */
    public static final String DUPLICATE_LOGIN_MESSAGE = "이미 다른 곳에서 로그인되어 있습니다. 기존 세션이 종료됩니다.";
    
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
