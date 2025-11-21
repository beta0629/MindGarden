package com.coresolution.core.constant;

/**
 * 대시보드 관련 상수 정의
 * 하드코딩 금지 원칙에 따라 모든 상수를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
public class DashboardConstants {
    
    // 업종 코드 상수
    public static final String BUSINESS_TYPE_ACADEMY = "ACADEMY";
    public static final String BUSINESS_TYPE_CONSULTATION = "CONSULTATION";
    
    // 역할 코드 상수 (학원)
    public static final String ROLE_CODE_STUDENT = "STUDENT";
    public static final String ROLE_CODE_TEACHER = "TEACHER";
    public static final String ROLE_CODE_ADMIN = "ADMIN";
    
    // 역할 코드 상수 (상담소)
    public static final String ROLE_CODE_CLIENT = "CLIENT";
    public static final String ROLE_CODE_CONSULTANT = "CONSULTANT";
    
    // 역할명 상수 (학원)
    public static final String ROLE_NAME_STUDENT = "학생";
    public static final String ROLE_NAME_TEACHER = "선생님";
    public static final String ROLE_NAME_ADMIN = "관리자";
    
    // 역할명 상수 (상담소)
    public static final String ROLE_NAME_CLIENT = "내담자";
    public static final String ROLE_NAME_CONSULTANT = "상담사";
    
    // 대시보드명 상수 (학원)
    public static final String DASHBOARD_NAME_STUDENT = "학생 대시보드";
    public static final String DASHBOARD_NAME_TEACHER = "선생님 대시보드";
    public static final String DASHBOARD_NAME_ADMIN = "관리자 대시보드";
    
    // 대시보드명 상수 (상담소)
    public static final String DASHBOARD_NAME_CLIENT = "내담자 대시보드";
    public static final String DASHBOARD_NAME_CONSULTANT = "상담사 대시보드";
    
    // 설명 템플릿
    public static final String DASHBOARD_DESCRIPTION_TEMPLATE = "{0}용 기본 대시보드입니다.";
    
    // 에러 메시지 상수
    public static final String ERROR_DASHBOARD_NOT_FOUND = "대시보드를 찾을 수 없습니다: {0}";
    public static final String ERROR_ACCESS_DENIED = "접근 권한이 없습니다.";
    public static final String ERROR_DASHBOARD_ALREADY_EXISTS = "해당 역할에 이미 대시보드가 존재합니다.";
    public static final String ERROR_DEFAULT_DASHBOARD_CANNOT_DELETE = "기본 대시보드는 삭제할 수 없습니다. 비활성화만 가능합니다.";
    
    // 생성자 방지
    private DashboardConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}

