package com.coresolution.consultation.constant;

/**
 * 사용자 역할 enum
 *
 * 2025-02: ADMIN, STAFF, CONSULTANT, CLIENT 4개로 단순화.
 * 레거시 역할(PRINCIPAL, TENANT_ADMIN, PARENT 등)은 fromString()에서 위 4개로 매핑.
 *
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-02 - 4역할만 사용 (ADMIN, STAFF, CONSULTANT, CLIENT)
 */
public enum UserRole {
    /** 테넌트 관리자 (원장/사장 등, ERP 포함 전체 권한) */
    ADMIN("관리자"),

    /** 전문가 (상담사/강사 등) */
    CONSULTANT("상담사"),

    /** 고객 (내담자/학생 등) */
    CLIENT("내담자"),

    /** 사무원/행정 (ERP 제외 관리 기능, 원장이 추가 권한 부여 가능) */
    STAFF("사무원");

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

    /** 관리자 역할인지 (ADMIN만) */
    public boolean isAdmin() {
        return this == ADMIN;
    }

    public boolean isConsultant() {
        return this == CONSULTANT;
    }

    public boolean isClient() {
        return this == CLIENT;
    }

    public boolean isStaff() {
        return this == STAFF;
    }

    // ===== 역할 목록 반환 =====

    public static UserRole[] getAllRoles() {
        return values();
    }

    public static UserRole[] getAdminRoles() {
        return new UserRole[]{ADMIN};
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

    // ===== 문자열 변환 (하위 호환성) =====

    /**
     * 문자열로부터 UserRole 변환.
     * 레거시 역할(PRINCIPAL, TENANT_ADMIN, PARENT, HQ_*, BRANCH_* 등)은 ADMIN 또는 STAFF로 매핑.
     */
    public static UserRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            return CLIENT;
        }

        String normalizedRole = role.trim().toUpperCase();
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }

        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            return mapLegacyRole(normalizedRole);
        }
    }

    /**
     * 레거시 역할을 4역할로 매핑
     */
    private static UserRole mapLegacyRole(String legacyRole) {
        switch (legacyRole) {
            case "BRANCH_ADMIN":
            case "BRANCH_SUPER_ADMIN":
            case "HQ_ADMIN":
            case "SUPER_HQ_ADMIN":
            case "HQ_MASTER":
            case "HQ_SUPER_ADMIN":
            case "BRANCH_MANAGER":
            case "SUPERADMIN":
            case "ROOT":
            case "TENANT_ADMIN":
            case "TENANTADMIN":
            case "PRINCIPAL":
            case "OWNER":
            case "원장":
            case "사장":
            case "테넌트관리자":
                return ADMIN;

            case "COUNSELOR":
                return CONSULTANT;

            case "USER":
            case "CUSTOMER":
                return CLIENT;

            case "PARENT":
            case "학부모":
            case "OFFICE_STAFF":
            case "OFFICESTAFF":
                return STAFF;

            default:
                return CLIENT;
        }
    }
}
