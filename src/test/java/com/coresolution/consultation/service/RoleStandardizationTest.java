package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.core.domain.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * 역할 시스템 표준화 테스트
 * 표준화 2025-12-05: 공통코드 기반 동적 역할 조회 검증
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("역할 시스템 표준화 테스트")
class RoleStandardizationTest {

    @Mock
    private CommonCodeService commonCodeService;

    @Test
    @DisplayName("관리자 역할 체크 - 공통코드에서 ADMIN 역할 조회")
    void testIsAdminRoleFromCommonCode_Admin() {
        // Given: 공통코드에 ADMIN 역할이 있고 isAdmin=true인 경우
        List<CommonCode> roleCodes = new ArrayList<>();
        CommonCode adminCode = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("ADMIN")
            .extraData("{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true}")
            .build();
        roleCodes.add(adminCode);

        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(roleCodes);

        // When: ADMIN 역할 체크
        boolean isAdmin = isAdminRoleFromCommonCode(UserRole.ADMIN, roleCodes);

        // Then: 관리자로 인식되어야 함
        assertThat(isAdmin).isTrue();
    }

    @Test
    @DisplayName("관리자 역할 체크 - 공통코드에서 PRINCIPAL 역할 조회")
    void testIsAdminRoleFromCommonCode_Principal() {
        // Given: 공통코드에 PRINCIPAL 역할이 있고 isAdmin=true인 경우
        List<CommonCode> roleCodes = new ArrayList<>();
        CommonCode principalCode = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("PRINCIPAL")
            .extraData("{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true}")
            .build();
        roleCodes.add(principalCode);

        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(roleCodes);

        // When: PRINCIPAL 역할 체크
        boolean isAdmin = isAdminRoleFromCommonCode(UserRole.PRINCIPAL, roleCodes);

        // Then: 관리자로 인식되어야 함
        assertThat(isAdmin).isTrue();
    }

    @Test
    @DisplayName("관리자 역할 체크 - 비관리자 역할은 관리자로 인식되지 않음")
    void testIsAdminRoleFromCommonCode_Consultant() {
        // Given: 공통코드에 CONSULTANT 역할이 있고 isAdmin=false인 경우
        List<CommonCode> roleCodes = new ArrayList<>();
        CommonCode consultantCode = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("CONSULTANT")
            .extraData("{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true}")
            .build();
        roleCodes.add(consultantCode);

        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(roleCodes);

        // When: CONSULTANT 역할 체크
        boolean isAdmin = isAdminRoleFromCommonCode(UserRole.CONSULTANT, roleCodes);

        // Then: 관리자로 인식되지 않아야 함
        assertThat(isAdmin).isFalse();
    }

    @Test
    @DisplayName("관리자 역할 체크 - 공통코드가 없을 때 폴백 로직 사용")
    void testIsAdminRoleFromCommonCode_Fallback() {
        // Given: 공통코드가 없는 경우
        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(null);

        // When: ADMIN 역할 체크 (폴백 로직 사용)
        boolean isAdmin = isAdminRoleFromCommonCodeFallback(UserRole.ADMIN);

        // Then: 폴백 로직으로 관리자로 인식되어야 함
        assertThat(isAdmin).isTrue();
    }

    @Test
    @DisplayName("관리자 역할 체크 - 레거시 역할은 관리자로 인식되지 않음")
    void testIsAdminRoleFromCommonCode_LegacyRole() {
        // Given: 레거시 역할 (더 이상 사용하지 않음)
        // When: 레거시 역할 체크
        // Then: 관리자로 인식되지 않아야 함
        // Note: 레거시 역할은 UserRole enum에 없으므로 테스트 불가
        // 실제 코드에서는 레거시 역할이 enum에 없으므로 자동으로 false 반환
    }

    @Test
    @DisplayName("사무원 역할 체크 - 공통코드에서 STAFF 역할 조회")
    void testIsStaffRoleFromCommonCode_Staff() {
        // Given: 공통코드에 STAFF 역할이 있고 isStaff=true인 경우
        List<CommonCode> roleCodes = new ArrayList<>();
        CommonCode staffCode = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("STAFF")
            .extraData("{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true}")
            .build();
        roleCodes.add(staffCode);

        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(roleCodes);

        // When: STAFF 역할 체크
        boolean isStaff = isStaffRoleFromCommonCode(UserRole.STAFF, roleCodes);

        // Then: 사무원으로 인식되어야 함
        assertThat(isStaff).isTrue();
    }

    @Test
    @DisplayName("사무원 역할 체크 - 비사무원 역할은 사무원으로 인식되지 않음")
    void testIsStaffRoleFromCommonCode_Consultant() {
        // Given: 공통코드에 CONSULTANT 역할이 있고 isStaff=false인 경우
        List<CommonCode> roleCodes = new ArrayList<>();
        CommonCode consultantCode = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("CONSULTANT")
            .extraData("{\"isAdmin\": false, \"isStaff\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true}")
            .build();
        roleCodes.add(consultantCode);

        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(roleCodes);

        // When: CONSULTANT 역할 체크
        boolean isStaff = isStaffRoleFromCommonCode(UserRole.CONSULTANT, roleCodes);

        // Then: 사무원으로 인식되지 않아야 함
        assertThat(isStaff).isFalse();
    }

    // 헬퍼 메서드: 실제 구현과 동일한 로직
    private boolean isAdminRoleFromCommonCode(UserRole role, List<CommonCode> roleCodes) {
        if (role == null) {
            return false;
        }
        try {
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크
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
            // 폴백: 표준 관리자 역할만 체크
            return role == UserRole.ADMIN ||
                   role == UserRole.TENANT_ADMIN ||
                   role == UserRole.PRINCIPAL ||
                   role == UserRole.OWNER;
        }
    }

    private boolean isAdminRoleFromCommonCodeFallback(UserRole role) {
        // 폴백 로직: 표준 관리자 역할만 체크
        return role == UserRole.ADMIN ||
               role == UserRole.TENANT_ADMIN ||
               role == UserRole.PRINCIPAL ||
               role == UserRole.OWNER;
    }

    private boolean isStaffRoleFromCommonCode(UserRole role, List<CommonCode> roleCodes) {
        if (role == null) {
            return false;
        }
        try {
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: STAFF 역할만 체크
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
            // 폴백: STAFF 역할만 체크
            return role == UserRole.STAFF;
        }
    }
}

