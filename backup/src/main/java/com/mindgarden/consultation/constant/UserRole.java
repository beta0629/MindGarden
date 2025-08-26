package com.mindgarden.consultation.constant;

/**
 * 사용자 역할 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class UserRole {
    
    // 내담자 역할
    public static final String CLIENT = "CLIENT";
    
    // 상담사 역할
    public static final String CONSULTANT = "CONSULTANT";
    
    // 관리자 역할
    public static final String ADMIN = "ADMIN";
    
    // 최고 관리자 역할
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    
    // 역할 목록
    public static final String[] ALL_ROLES = {
        CLIENT, CONSULTANT, ADMIN, SUPER_ADMIN
    };
    
    // 관리자 역할 목록
    public static final String[] ADMIN_ROLES = {
        ADMIN, SUPER_ADMIN
    };
    
    // 상담사 역할 목록
    public static final String[] CONSULTANT_ROLES = {
        CONSULTANT
    };
    
    // 내담자 역할 목록
    public static final String[] CLIENT_ROLES = {
        CLIENT
    };
}
