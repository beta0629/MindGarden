package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link UserRoleCapabilityUtils} 단위 테스트 — 한 계정·복수 역할 SSOT.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@DisplayName("UserRoleCapabilityUtils — dual-role SSOT")
class UserRoleCapabilityUtilsTest {

    @Test
    @DisplayName("ADMIN(counselingEnabled=false) — 운영자만")
    void adminWithoutCounseling_isOperatorOnly() {
        User user = userOf(UserRole.ADMIN, false);

        assertThat(UserRoleCapabilityUtils.hasOperatorRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.hasCounselorRole(user)).isFalse();
        assertThat(UserRoleCapabilityUtils.isDualRole(user)).isFalse();
        assertThat(UserRoleCapabilityUtils.getAvailableRoles(user)).containsExactly("ADMIN");
    }

    @Test
    @DisplayName("ADMIN(counselingEnabled=true) — 듀얼 역할")
    void adminWithCounseling_isDualRole() {
        User user = userOf(UserRole.ADMIN, true);

        assertThat(UserRoleCapabilityUtils.hasOperatorRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.hasCounselorRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.isDualRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.getAvailableRoles(user)).containsExactly("ADMIN", "CONSULTANT");
    }

    @Test
    @DisplayName("CONSULTANT — 상담사만")
    void consultant_isCounselorOnly() {
        User user = userOf(UserRole.CONSULTANT, false);

        assertThat(UserRoleCapabilityUtils.hasOperatorRole(user)).isFalse();
        assertThat(UserRoleCapabilityUtils.hasCounselorRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.isDualRole(user)).isFalse();
        assertThat(UserRoleCapabilityUtils.getAvailableRoles(user)).containsExactly("CONSULTANT");
    }

    @Test
    @DisplayName("STAFF — 운영자만")
    void staff_isOperatorOnly() {
        User user = userOf(UserRole.STAFF, false);

        assertThat(UserRoleCapabilityUtils.hasOperatorRole(user)).isTrue();
        assertThat(UserRoleCapabilityUtils.hasCounselorRole(user)).isFalse();
        assertThat(UserRoleCapabilityUtils.getAvailableRoles(user)).containsExactly("STAFF");
    }

    private static User userOf(UserRole role, boolean counselingEnabled) {
        User user = new User();
        user.setId(1L);
        user.setRole(role);
        user.setCounselingEnabled(counselingEnabled);
        return user;
    }
}
