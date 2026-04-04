package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.UserRole;

/**
 * ROLE 공통코드(extra_data)와 시스템 {@link UserRole}을 함께 고려한 관리자·스태프 판별.
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
public interface RoleCommonCodeAuthorizationService {

    /**
     * 관리자 역할 여부 (공통코드 매칭 또는 ADMIN / {@link UserRole#isAdmin()} 폴백).
     *
     * @param role 현재 역할
     * @return 관리자로 인정되면 true
     */
    boolean isAdminRoleFromCommonCode(UserRole role);

    /**
     * 스태프 역할 여부 (공통코드 매칭 또는 {@link UserRole#STAFF} 폴백).
     *
     * @param role 현재 역할
     * @return 스태프로 인정되면 true
     */
    boolean isStaffRoleFromCommonCode(UserRole role);

    /**
     * 관리자 또는 스태프 여부.
     *
     * @param role 현재 역할
     * @return 둘 중 하나에 해당하면 true
     */
    boolean isAdminOrStaffRoleFromCommonCode(UserRole role);
}
