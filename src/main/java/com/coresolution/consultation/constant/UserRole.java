package com.coresolution.consultation.constant;

/**
 * 사용자 역할 enum
 * 
 * 표준화 2025-12-05: 브랜치/HQ 개념 제거, 핵심 역할 5개 + 표준 관리자 역할 사용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-12-05 - 표준 역할 시스템으로 재구성
 */
public enum UserRole {
    // ===== 핵심 역할 (5개) =====
    
    /** 테넌트 관리자 */
    ADMIN("관리자"),
    
    /** 전문가 (상담사/강사/의사) */
    CONSULTANT("상담사"),
    
    /** 고객 (내담자/학생/환자) */
    CLIENT("내담자"),
    
    /** 사무원/행정직원 */
    STAFF("사무원"),
    
    /** 학부모 (학원 전용) */
    PARENT("학부모"),
    
    // ===== 표준 관리자 역할 =====
    
    /** 테넌트 관리자 */
    TENANT_ADMIN("테넌트관리자"),
    
    /** 원장 (학원 최고 관리자) */
    PRINCIPAL("원장"),
    
    /** 사장 (사업체 대표) */
    OWNER("사장");
    
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
    
    // ===== 권한 체크 메서드 =====
    
    /**
     * 관리자 역할인지 확인
     * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
     */
    public boolean isAdmin() {
        return this == ADMIN || 
               this == TENANT_ADMIN || 
               this == PRINCIPAL || 
               this == OWNER;
    }
    
    /**
     * 상담사 역할인지 확인
     */
    public boolean isConsultant() {
        return this == CONSULTANT;
    }
    
    /**
     * 내담자 역할인지 확인
     */
    public boolean isClient() {
        return this == CLIENT;
    }
    
    /**
     * 사무원 역할인지 확인
     */
    public boolean isStaff() {
        return this == STAFF;
    }
    
    /**
     * 학부모 역할인지 확인
     */
    public boolean isParent() {
        return this == PARENT;
    }
    
    // ===== 역할 목록 반환 =====
    
    public static UserRole[] getAllRoles() {
        return values();
    }
    
    public static UserRole[] getAdminRoles() {
        return new UserRole[]{ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER};
    }
    
    public static UserRole[] getConsultantRoles() {
        return new UserRole[]{CONSULTANT};
    }
    
    public static UserRole[] getClientRoles() {
        return new UserRole[]{CLIENT};
    }
    
    public static UserRole[] getStaffRoles() {
        return new UserRole[]{STAFF};
    }
    
    public static UserRole[] getParentRoles() {
        return new UserRole[]{PARENT};
    }
    
    // ===== 문자열 변환 (하위 호환성) =====
    
    /**
     * 문자열로부터 UserRole 변환
     * 레거시 역할 매핑 지원
     */
    public static UserRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            return CLIENT; // 기본값
        }
        
        String normalizedRole = role.trim().toUpperCase();
        
        // ROLE_ 접두사 제거
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        
        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            // 레거시 역할 매핑 (하위 호환성)
            return mapLegacyRole(normalizedRole);
        }
    }
    
    /**
     * 레거시 역할을 표준 역할로 매핑
     */
    private static UserRole mapLegacyRole(String legacyRole) {
        switch (legacyRole) {
            // 관리자 역할 매핑 -> ADMIN
            case "BRANCH_ADMIN":
            case "BRANCH_SUPER_ADMIN":
            case "HQ_ADMIN":
            case "SUPER_HQ_ADMIN":
            case "HQ_MASTER":
            case "HQ_SUPER_ADMIN":
            case "BRANCH_MANAGER":
            case "SUPERADMIN":
            case "ROOT":
                return ADMIN;
            
            // 표준 관리자 역할
            case "PRINCIPAL":
            case "원장":
                return PRINCIPAL;
            case "OWNER":
            case "사장":
                return OWNER;
            case "TENANT_ADMIN":
            case "TENANTADMIN":
            case "테넌트관리자":
                return TENANT_ADMIN;
            
            // 상담사 역할 매핑
            case "COUNSELOR":
                return CONSULTANT;
            
            // 내담자 역할 매핑
            case "USER":
            case "CUSTOMER":
                return CLIENT;
            
            // 사무원 역할 매핑
            case "OFFICE_STAFF":
            case "OFFICESTAFF":
                return STAFF;
            
            // 학부모 역할 매핑
            case "PARENT":
            case "학부모":
                return PARENT;
            
            // 기본값
            default:
                return CLIENT;
        }
    }
}
