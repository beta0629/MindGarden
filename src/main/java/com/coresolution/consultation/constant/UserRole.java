package com.coresolution.consultation.constant;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * 사용자 역할 enum
 *
 * 2025-02: ADMIN, STAFF, CONSULTANT, CLIENT 4개로 단순화.
 * 2026-05: 상담 외 전문가(놀이치료·언어치료) 역할 추가. 동일 전문가 권한 묶음은 {@link #isProfessionalProvider()}.
 * 레거시 역할(PRINCIPAL, TENANT_ADMIN, PARENT 등)은 fromString()에서 표준 역할로 매핑.
 *
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-02 - 4역할만 사용 (ADMIN, STAFF, CONSULTANT, CLIENT)
 * @updated 2026-05 - PLAY_THERAPIST, SPEECH_THERAPIST 추가
 */
public enum UserRole {
    /** 테넌트 관리자 (원장/사장 등, ERP 포함 전체 권한) */
    ADMIN("관리자"),

    /** 전문가 (상담사/강사 등) */
    CONSULTANT("상담사"),

    /** 전문가 (놀이치료) */
    PLAY_THERAPIST("놀이치료 선생님"),

    /** 전문가 (언어치료) */
    SPEECH_THERAPIST("언어치료 선생님"),

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

    /**
     * 상담·놀이·언어 등 현장 전문가(스케줄·매핑·상담사 메뉴 권한 묶음).
     *
     * @return 전문 제공자 역할이면 true
     */
    public boolean isProfessionalProvider() {
        return this == CONSULTANT || this == PLAY_THERAPIST || this == SPEECH_THERAPIST;
    }

    /**
     * 전문가(상담사 계열) 여부. 기존 코드 호환을 위해 {@link #isProfessionalProvider()}와 동일.
     *
     * @return 상담사·치료 전문가 역할이면 true
     */
    public boolean isConsultant() {
        return isProfessionalProvider();
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
        return new UserRole[]{CONSULTANT, PLAY_THERAPIST, SPEECH_THERAPIST};
    }

    /**
     * 스케줄·매핑 등에서 상담사로 취급하는 역할 목록 (불변).
     *
     * @return 전문 제공자 역할 목록
     */
    public static List<UserRole> getProfessionalProviderRoles() {
        return Collections.unmodifiableList(Arrays.asList(CONSULTANT, PLAY_THERAPIST, SPEECH_THERAPIST));
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
