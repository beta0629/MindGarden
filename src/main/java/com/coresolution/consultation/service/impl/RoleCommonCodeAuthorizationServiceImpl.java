package com.coresolution.consultation.service.impl;

import java.util.List;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ROLE 공통코드 조회 결과가 있어도 enum 기반 폴백으로 시스템 역할은 통과시킨다.
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleCommonCodeAuthorizationServiceImpl implements RoleCommonCodeAuthorizationService {

    private static final String ROLE_CODE_GROUP = "ROLE";
    private static final String EXTRA_IS_ADMIN_TRUE = "\"isAdmin\":true";
    private static final String EXTRA_ROLE_TYPE_ADMIN = "\"roleType\":\"ADMIN\"";
    private static final String EXTRA_IS_STAFF_TRUE = "\"isStaff\":true";
    private static final String EXTRA_ROLE_TYPE_STAFF = "\"roleType\":\"STAFF\"";

    private final CommonCodeService commonCodeService;

    @Override
    public boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup(ROLE_CODE_GROUP);
            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.ADMIN || role.isAdmin();
            }
            String roleName = role.name();
            boolean fromCommonCode = roleCodes.stream()
                .anyMatch(code -> roleName.equals(code.getCodeValue()) && matchesAdminExtra(code.getExtraData()));
            return fromCommonCode || role == UserRole.ADMIN || role.isAdmin();
        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.ADMIN || role.isAdmin();
        }
    }

    @Override
    public boolean isStaffRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup(ROLE_CODE_GROUP);
            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.STAFF;
            }
            String roleName = role.name();
            boolean fromCommonCode = roleCodes.stream()
                .anyMatch(code -> roleName.equals(code.getCodeValue()) && matchesStaffExtra(code.getExtraData()));
            return fromCommonCode || role == UserRole.STAFF;
        } catch (Exception e) {
            log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.STAFF;
        }
    }

    @Override
    public boolean isAdminOrStaffRoleFromCommonCode(UserRole role) {
        return isAdminRoleFromCommonCode(role) || isStaffRoleFromCommonCode(role);
    }

    private static boolean matchesAdminExtra(String extraData) {
        return extraData != null
            && (extraData.contains(EXTRA_IS_ADMIN_TRUE) || extraData.contains(EXTRA_ROLE_TYPE_ADMIN));
    }

    private static boolean matchesStaffExtra(String extraData) {
        return extraData != null
            && (extraData.contains(EXTRA_IS_STAFF_TRUE) || extraData.contains(EXTRA_ROLE_TYPE_STAFF));
    }
}
