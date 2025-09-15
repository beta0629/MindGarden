package com.mindgarden.consultation.constant;

/**
 * 세션 관련 상수
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public final class SessionConstants {
    
    private SessionConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    // ===== 로그인 세션 관련 상수 =====
    
    /**
     * 로그인 세션 네임스페이스
     */
    public static final String LOGIN_SESSION_NAMESPACE = "LOGIN_SESSION";
    
    /**
     * 사용자 인증 정보
     */
    public static final String USER_AUTHENTICATION = "USER_AUTHENTICATION";
    
    /**
     * 사용자 ID
     */
    public static final String USER_ID = "USER_ID";
    
    /**
     * 사용자 이메일
     */
    public static final String USER_EMAIL = "USER_EMAIL";
    
    /**
     * 사용자 역할
     */
    public static final String ROLE = "ROLE";
    
    /**
     * 로그인 시간
     */
    public static final String LOGIN_TIME = "LOGIN_TIME";
    
    /**
     * 마지막 활동 시간
     */
    public static final String LAST_ACTIVITY_TIME = "LAST_ACTIVITY_TIME";
    
    /**
     * 세션 만료 시간
     */
    public static final String SESSION_EXPIRY_TIME = "SESSION_EXPIRY_TIME";
    
    /**
     * 소셜 로그인 여부
     */
    public static final String IS_SOCIAL_LOGIN = "IS_SOCIAL_LOGIN";
    
    /**
     * 소셜 제공자
     */
    public static final String SOCIAL_PROVIDER = "SOCIAL_PROVIDER";
    
    // ===== 비즈니스 로직 세션 관련 상수 =====
    
    /**
     * 비즈니스 로직 세션 네임스페이스
     */
    public static final String BUSINESS_SESSION_NAMESPACE = "BUSINESS_SESSION";
    
    /**
     * 사용자 프로필 정보 (복호화된 데이터)
     */
    public static final String USER_PROFILE = "USER_PROFILE";
    
    /**
     * 사용자 이름
     */
    public static final String USER_NAME = "USER_NAME";
    
    /**
     * 사용자 닉네임
     */
    public static final String USER_NICKNAME = "USER_NICKNAME";
    
    /**
     * 사용자 휴대폰 번호
     */
    public static final String USER_PHONE = "USER_PHONE";
    
    /**
     * 사용자 성별
     */
    public static final String USER_GENDER = "USER_GENDER";
    
    /**
     * 사용자 생년월일
     */
    public static final String USER_BIRTH_DATE = "USER_BIRTH_DATE";
    
    /**
     * 사용자 프로필 이미지
     */
    public static final String USER_PROFILE_IMAGE = "USER_PROFILE_IMAGE";
    
    /**
     * 사용자 설정 정보
     */
    public static final String USER_SETTINGS = "USER_SETTINGS";
    
    /**
     * 사용자 권한 정보
     */
    public static final String USER_PERMISSIONS = "USER_PERMISSIONS";
    
    // ===== 세션 관리 관련 상수 =====
    
    /**
     * 세션 타임아웃 (초)
     */
    public static final int SESSION_TIMEOUT_SECONDS = 1800; // 30분
    
    /**
     * 비즈니스 세션 타임아웃 (초)
     */
    public static final int BUSINESS_SESSION_TIMEOUT_SECONDS = 3600; // 1시간
    
    /**
     * 세션 갱신 간격 (초)
     */
    public static final int SESSION_REFRESH_INTERVAL_SECONDS = 300; // 5분
    
    /**
     * 최대 동시 세션 수
     */
    public static final int MAX_CONCURRENT_SESSIONS = 3;
    
    // ===== 세션 상태 관련 상수 =====
    
    /**
     * 세션 상태 - 활성
     */
    public static final String SESSION_STATUS_ACTIVE = "ACTIVE";
    
    /**
     * 세션 상태 - 만료
     */
    public static final String SESSION_STATUS_EXPIRED = "EXPIRED";
    
    /**
     * 세션 상태 - 무효화
     */
    public static final String SESSION_STATUS_INVALIDATED = "INVALIDATED";
    
    /**
     * 세션 상태 - 일시정지
     */
    public static final String SESSION_STATUS_SUSPENDED = "SUSPENDED";
}
