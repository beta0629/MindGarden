package com.coresolution.consultation.constant;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * 사용자 역할 enum (4종 SSOT).
 *
 * <p>2025-02: ADMIN, STAFF, CONSULTANT, CLIENT 4개로 단순화.</p>
 * <p>2026-05: 상담 외 전문가(놀이치료·언어치료) 역할을 별도 enum 으로 추가했었음(PLAY_THERAPIST, SPEECH_THERAPIST).</p>
 * <p>2026-06: <b>4종 SSOT 재정립</b>. 전문가의 세부 분류(놀이·언어 등)는 enum 이 아니라
 * {@code users.professional_provider_type_code} 컬럼(공통코드 {@code PROFESSIONAL_PROVIDER_TYPE})으로
 * 표현한다. 따라서 enum 은 다시 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 으로 축소되었으며,
 * 레거시 PLAY_THERAPIST/SPEECH_THERAPIST 문자열은 {@link #fromString(String)} → {@link #mapLegacyRole(String)}
 * 경로에서 {@link #CONSULTANT} 로 매핑되어 호환된다. (세부 specialization 은 별도 컬럼 조회)</p>
 *
 * <p>레거시 역할(PRINCIPAL, TENANT_ADMIN, PARENT, HQ_*, BRANCH_* 등) 역시 {@link #fromString(String)}
 * 에서 표준 4종 중 하나로 매핑된다.</p>
 *
 * @author MindGarden
 * @version 3.0.0
 * @since 2024-12-19
 * @updated 2025-02 - 4역할만 사용 (ADMIN, STAFF, CONSULTANT, CLIENT)
 * @updated 2026-05 - PLAY_THERAPIST, SPEECH_THERAPIST 추가
 * @updated 2026-06 - PLAY/SPEECH enum 제거, professional_provider_type_code 컬럼으로 specialization 흡수 (4종 SSOT 복귀)
 */
public enum UserRole {
    /** 테넌트 관리자 (원장/사장 등, ERP 포함 전체 권한) */
    ADMIN("관리자"),

    /** 전문가 (상담사/놀이치료/언어치료 등 모든 현장 전문가 — 세부 분류는 users.professional_provider_type_code) */
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

    /**
     * 상담·놀이·언어 등 현장 전문가(스케줄·매핑·상담사 메뉴 권한 묶음).
     *
     * <p>2026-06 4종 SSOT 후: CONSULTANT 단일 비교. 세부 분류(놀이·언어)는
     * {@code users.professional_provider_type_code} 로 구분한다.</p>
     *
     * @return 전문 제공자 역할이면 true
     */
    public boolean isProfessionalProvider() {
        return this == CONSULTANT;
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
        return new UserRole[]{CONSULTANT};
    }

    /**
     * 스케줄·매핑 등에서 상담사로 취급하는 역할 목록 (불변).
     *
     * <p>2026-06 4종 SSOT 후: CONSULTANT 단일 항목. 세부 분류는 별도 컬럼(specialization) 사용.</p>
     *
     * @return 전문 제공자 역할 목록
     */
    public static List<UserRole> getProfessionalProviderRoles() {
        return Collections.unmodifiableList(Arrays.asList(CONSULTANT));
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
     * 레거시 역할(PRINCIPAL, TENANT_ADMIN, PARENT, HQ_*, BRANCH_*, PLAY_THERAPIST, SPEECH_THERAPIST 등)은
     * 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 중 하나로 매핑된다.
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
     * 레거시 역할을 4역할로 매핑.
     *
     * <p>2026-06 4종 SSOT 후: PLAY_THERAPIST/SPEECH_THERAPIST 도 CONSULTANT 로 매핑된다.
     * 호출자는 세부 specialization(놀이·언어 등) 이 필요하면
     * {@code users.professional_provider_type_code} 를 별도로 조회한다.</p>
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
            case "PLAY_THERAPIST":
            case "SPEECH_THERAPIST":
            case "놀이치료선생님":
            case "언어치료선생님":
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
