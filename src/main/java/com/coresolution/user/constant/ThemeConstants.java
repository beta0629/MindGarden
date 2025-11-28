package com.coresolution.user.constant;

import java.text.MessageFormat;

/**
 * 테마 시스템 관련 상수 정의
 * 하드코딩 방지를 위한 모든 상수를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-27
 */
public final class ThemeConstants {
    
    private ThemeConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    // ==================== 테마 타입 상수 ====================
    
    /** 내담자 테마 */
    public static final String THEME_CLIENT = "client";
    
    /** 상담사 테마 */
    public static final String THEME_CONSULTANT = "consultant";
    
    /** 관리자 테마 */
    public static final String THEME_ADMIN = "admin";
    
    // ==================== 역할 코드 상수 ====================
    
    /** 내담자 역할 */
    public static final String ROLE_CLIENT = "CLIENT";
    
    /** 상담사 역할 */
    public static final String ROLE_CONSULTANT = "CONSULTANT";
    
    /** 관리자 역할 */
    public static final String ROLE_ADMIN = "ADMIN";
    
    /** 레거시 역할 접두사 */
    public static final String ROLE_PREFIX = "ROLE_";
    
    // ==================== 공통 코드 그룹 상수 ====================
    
    /** 사용자 테마 공통 코드 그룹 */
    public static final String CODE_GROUP_USER_THEMES = "USER_THEMES";
    
    /** 테마 색상 공통 코드 그룹 */
    public static final String CODE_GROUP_THEME_COLORS = "THEME_COLORS";
    
    /** 역할별 기본 테마 매핑 공통 코드 그룹 */
    public static final String CODE_GROUP_ROLE_THEME_MAPPING = "ROLE_THEME_MAPPING";
    
    // ==================== 에러 메시지 상수 ====================
    
    /** 사용자 미발견 에러 */
    public static final String ERROR_USER_NOT_FOUND = "사용자를 찾을 수 없습니다: {0}";
    
    /** 유효하지 않은 테마 에러 */
    public static final String ERROR_INVALID_THEME = "지원하지 않는 테마입니다: {0}";
    
    /** 테마 설정 누락 에러 */
    public static final String ERROR_THEME_PREFERENCE_REQUIRED = "테마 설정이 올바르지 않습니다.";
    
    /** 커스텀 테마 색상 저장 실패 */
    public static final String ERROR_CUSTOM_COLORS_SAVE_FAILED = "커스텀 테마 색상 저장에 실패했습니다.";
    
    /** 커스텀 테마 색상 파싱 실패 */
    public static final String ERROR_CUSTOM_COLORS_PARSE_FAILED = "커스텀 테마 색상 파싱에 실패했습니다.";
    
    // ==================== 성공 메시지 상수 ====================
    
    /** 테마 업데이트 성공 */
    public static final String SUCCESS_THEME_UPDATED = "테마가 업데이트되었습니다.";
    
    /** 테마 초기화 성공 */
    public static final String SUCCESS_THEME_RESET = "테마가 초기화되었습니다.";
    
    /** 테마 미리보기 취소 성공 */
    public static final String SUCCESS_PREVIEW_CANCELLED = "테마 미리보기가 취소되었습니다.";
    
    // ==================== 테마 정보 상수 ====================
    
    /** 내담자 테마 정보 */
    public static final String THEME_CLIENT_NAME = "내담자 테마";
    public static final String THEME_CLIENT_DESCRIPTION = "화사한 분위기 (핑크 계열)";
    public static final String THEME_CLIENT_PREVIEW_COLOR = "#FFB6C1";
    
    /** 상담사 테마 정보 */
    public static final String THEME_CONSULTANT_NAME = "상담사 테마";
    public static final String THEME_CONSULTANT_DESCRIPTION = "활력 충만 분위기 (민트 그린 계열)";
    public static final String THEME_CONSULTANT_PREVIEW_COLOR = "#98FB98";
    
    /** 관리자 테마 정보 */
    public static final String THEME_ADMIN_NAME = "관리자 테마";
    public static final String THEME_ADMIN_DESCRIPTION = "간결하고 깔끔한 분위기 (블루 계열)";
    public static final String THEME_ADMIN_PREVIEW_COLOR = "#87CEEB";
    
    // ==================== 헬퍼 메서드 ====================
    
    /**
     * 메시지 포맷팅
     */
    public static String formatError(String template, Object... args) {
        return MessageFormat.format(template, args);
    }
    
    /**
     * 유효한 테마 타입 목록
     */
    public static final String[] VALID_THEME_TYPES = {
        THEME_CLIENT, THEME_CONSULTANT, THEME_ADMIN
    };
}
