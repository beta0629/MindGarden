package com.mindgarden.consultation.constant;

/**
 * 사용자 역할 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public final class UserRoles {
    
    // 기본 역할
    public static final String CLIENT = "CLIENT";
    public static final String CONSULTANT = "CONSULTANT";
    public static final String ADMIN = "ADMIN";
    
    // 역할 그룹
    public static final String[] ALL_ROLES = {CLIENT, CONSULTANT, ADMIN};
    public static final String[] STAFF_ROLES = {CONSULTANT, ADMIN};
    
    // 역할 설명
    public static final String CLIENT_DESCRIPTION = "내담자";
    public static final String CONSULTANT_DESCRIPTION = "상담사";
    public static final String ADMIN_DESCRIPTION = "관리자";
    
    // 역할별 권한 레벨
    public static final int CLIENT_LEVEL = 1;
    public static final int CONSULTANT_LEVEL = 2;
    public static final int ADMIN_LEVEL = 3;
    
    private UserRoles() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
    
    /**
     * 역할이 유효한지 확인
     */
    public static boolean isValidRole(String role) {
        if (role == null) return false;
        for (String validRole : ALL_ROLES) {
            if (validRole.equals(role)) return true;
        }
        return false;
    }
    
    /**
     * 역할의 권한 레벨 반환
     */
    public static int getRoleLevel(String role) {
        switch (role) {
            case CLIENT: return CLIENT_LEVEL;
            case CONSULTANT: return CONSULTANT_LEVEL;
            case ADMIN: return ADMIN_LEVEL;
            default: return 0;
        }
    }
    
    /**
     * 역할 설명 반환
     */
    public static String getRoleDescription(String role) {
        switch (role) {
            case CLIENT: return CLIENT_DESCRIPTION;
            case CONSULTANT: return CONSULTANT_DESCRIPTION;
            case ADMIN: return ADMIN_DESCRIPTION;
            default: return "알 수 없음";
        }
    }
}
