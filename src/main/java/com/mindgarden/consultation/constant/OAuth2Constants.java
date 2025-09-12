package com.mindgarden.consultation.constant;

/**
 * OAuth2 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-03
 */
public class OAuth2Constants {
    
    // 프론트엔드 기본 URL (로컬 개발 환경용)
    public static final String FRONTEND_BASE_URL = "http://localhost:3000";
    
    // 역할별 대시보드 경로
    public static final String CLIENT_DASHBOARD_PATH = "/client/dashboard";
    public static final String CONSULTANT_DASHBOARD_PATH = "/consultant/dashboard";
    public static final String ADMIN_DASHBOARD_PATH = "/admin/dashboard";
    
    // 역할별 리다이렉트 URL
    public static final String CLIENT_REDIRECT_URL = FRONTEND_BASE_URL + CLIENT_DASHBOARD_PATH;
    public static final String CONSULTANT_REDIRECT_URL = FRONTEND_BASE_URL + CONSULTANT_DASHBOARD_PATH;
    public static final String ADMIN_REDIRECT_URL = FRONTEND_BASE_URL + ADMIN_DASHBOARD_PATH;
    
    // 기본 리다이렉트 URL (역할을 알 수 없는 경우)
    public static final String DEFAULT_REDIRECT_URL = CLIENT_REDIRECT_URL;
    
    // OAuth2 프로바이더
    public static final String PROVIDER_NAVER = "NAVER";
    public static final String PROVIDER_KAKAO = "KAKAO";
    
    // OAuth2 모드
    public static final String MODE_LOGIN = "login";
    public static final String MODE_LINK = "link";
    
    // OAuth2 응답 메시지
    public static final String MESSAGE_LOGIN_SUCCESS = "계정으로 로그인되었습니다.";
    public static final String MESSAGE_SIGNUP_REQUIRED = "간편 회원가입이 필요합니다.";
    public static final String MESSAGE_ACCOUNT_LINKED = "계정이 성공적으로 연동되었습니다.";
    
    // OAuth2 오류 메시지
    public static final String ERROR_AUTHENTICATION_FAILED = "OAuth2 인증 처리 중 오류가 발생했습니다: ";
    public static final String ERROR_USER_NOT_FOUND = "사용자를 찾을 수 없습니다.";
    public static final String ERROR_INVALID_CODE = "유효하지 않은 인증 코드입니다.";
    
    private OAuth2Constants() {
        // 유틸리티 클래스이므로 인스턴스화 방지
    }
}
