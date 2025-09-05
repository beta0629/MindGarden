package com.mindgarden.consultation.constant;

/**
 * 사용자 역할 enum 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public enum UserRole {
    
    // 내담자 역할
    CLIENT("내담자"),
    
    // 상담사 역할
    CONSULTANT("상담사"),
    
    // 관리자 역할
    ADMIN("관리자"),
    
    // 최고 관리자 역할
    SUPER_ADMIN("최고관리자");
    
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getValue() {
        return this.name();
    }
    
    // 관리자 역할인지 확인
    public boolean isAdmin() {
        return this == ADMIN || this == SUPER_ADMIN;
    }
    
    // 수퍼어드민 역할인지 확인
    public boolean isSuperAdmin() {
        return this == SUPER_ADMIN;
    }
    
    // 수퍼어드민 또는 일반 관리자인지 확인
    public boolean isAdminOrSuperAdmin() {
        return this == ADMIN || this == SUPER_ADMIN;
    }
    
    // 상담사 역할인지 확인
    public boolean isConsultant() {
        return this == CONSULTANT;
    }
    
    // 내담자 역할인지 확인
    public boolean isClient() {
        return this == CLIENT;
    }
    
    // 역할 목록 반환
    public static UserRole[] getAllRoles() {
        return values();
    }
    
    // 관리자 역할 목록 반환
    public static UserRole[] getAdminRoles() {
        return new UserRole[]{ADMIN, SUPER_ADMIN};
    }
    
    // 상담사 역할 목록 반환
    public static UserRole[] getConsultantRoles() {
        return new UserRole[]{CONSULTANT};
    }
    
    // 내담자 역할 목록 반환
    public static UserRole[] getClientRoles() {
        return new UserRole[]{CLIENT};
    }
    
    // 문자열로부터 UserRole 찾기 (기존 DB 호환성 포함)
    public static UserRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            return CLIENT; // 기본값
        }
        
        // 기존 스프링 시큐리티 역할 형식 처리
        String normalizedRole = role.trim().toUpperCase();
        
        // ROLE_ 접두사 제거
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        
        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            // 기존 데이터 호환성을 위한 매핑
            switch (normalizedRole) {
                case "USER":
                case "CUSTOMER":
                case "CLIENT":
                    return CLIENT;
                case "CONSULTANT":
                case "COUNSELOR":
                    return CONSULTANT;
                case "ADMIN":
                case "ADMINISTRATOR":
                    return ADMIN;
                case "SUPER_ADMIN":
                case "SUPERADMIN":
                case "ROOT":
                    return SUPER_ADMIN;
                default:
                    // 알 수 없는 역할은 기본값으로
                    System.err.println("알 수 없는 역할: " + role + " -> CLIENT로 변환");
                    return CLIENT;
            }
        }
    }
}
