package com.coresolution.consultation.constant;

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
    public static final String HQ_MASTER = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String BRANCH_MANAGER = "STAFF" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String BRANCH_HQ_MASTER = "BRANCH_HQ_MASTER";
    
    // 역할 그룹
    public static final String[] ALL_ROLES = {CLIENT, CONSULTANT, ADMIN, HQ_MASTER, BRANCH_MANAGER, BRANCH_HQ_MASTER};
    public static final String[] STAFF_ROLES = {CONSULTANT, ADMIN, HQ_MASTER, BRANCH_MANAGER, BRANCH_HQ_MASTER};
    public static final String[] HEADQUARTERS_ROLES = {ADMIN, HQ_MASTER};
    public static final String[] BRANCH_ROLES = {BRANCH_MANAGER, BRANCH_HQ_MASTER};
    public static final String[] BRANCH_MANAGEMENT_ROLES = {BRANCH_MANAGER, BRANCH_HQ_MASTER, ADMIN, HQ_MASTER};
    
    // 역할 설명
    public static final String CLIENT_DESCRIPTION = "내담자";
    public static final String CONSULTANT_DESCRIPTION = "상담사";
    public static final String ADMIN_DESCRIPTION = "본사관리자";
    public static final String HQ_MASTER_DESCRIPTION = "본사최고관리자";
    public static final String BRANCH_MANAGER_DESCRIPTION = "지점장";
    public static final String BRANCH_HQ_MASTER_DESCRIPTION = "지점최고관리자";
    
    // 역할별 권한 레벨
    public static final int CLIENT_LEVEL = 1;
    public static final int CONSULTANT_LEVEL = 2;
    public static final int BRANCH_MANAGER_LEVEL = 3;
    public static final int BRANCH_HQ_MASTER_LEVEL = 4;
    public static final int ADMIN_LEVEL = 5;
    public static final int HQ_MASTER_LEVEL = 6;
    
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
            case BRANCH_MANAGER: return BRANCH_MANAGER_LEVEL;
            case BRANCH_HQ_MASTER: return BRANCH_HQ_MASTER_LEVEL;
            case ADMIN: return ADMIN_LEVEL;
            case HQ_MASTER: return HQ_MASTER_LEVEL;
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
            case BRANCH_MANAGER: return BRANCH_MANAGER_DESCRIPTION;
            case BRANCH_HQ_MASTER: return BRANCH_HQ_MASTER_DESCRIPTION;
            case ADMIN: return ADMIN_DESCRIPTION;
            case HQ_MASTER: return HQ_MASTER_DESCRIPTION;
            default: return "알 수 없음";
        }
    }

/**

 * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)

 * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER

 * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음

 * @param role 사용자 역할

 * @return 관리자 역할 여부

 */

private boolean isAdminRoleFromCommonCode(UserRole role) {

    if (role == null) {

        return false;

    }

    try {

        // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)

            return role == UserRole.ADMIN || 

                   role == UserRole.TENANT_ADMIN || 

                   role == UserRole.PRINCIPAL || 

                   role == UserRole.OWNER;

        }

        // 공통코드에서 관리자 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isAdmin\":true") || 

                            code.getExtraData().contains("\"roleType\":\"ADMIN\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);

        // 폴백: 표준 관리자 역할만 체크

        return role == UserRole.ADMIN || 

               role == UserRole.TENANT_ADMIN || 

               role == UserRole.PRINCIPAL || 

               role == UserRole.OWNER;

    }

}


/**

 * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)

 * BRANCH_MANAGER → STAFF로 통합

 * @param role 사용자 역할

 * @return 사무원 역할 여부

 */

private boolean isStaffRoleFromCommonCode(UserRole role) {

    if (role == null) {

        return false;

    }

    try {

        // 공통코드에서 사무원 역할 목록 조회

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            return role == UserRole.STAFF;

        }

        // 공통코드에서 사무원 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isStaff\":true") || 

                            code.getExtraData().contains("\"roleType\":\"STAFF\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);

        return role == UserRole.STAFF;

    }

}

}
