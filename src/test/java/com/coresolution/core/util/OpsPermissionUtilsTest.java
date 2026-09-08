package com.coresolution.core.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.coresolution.core.constants.SecurityRoleConstants;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link OpsPermissionUtils} 단위 테스트 — requireOps fail-closed 회귀 가드.
 *
 * @author CoreSolution
 * @since 2026-03-24
 */
@DisplayName("OpsPermissionUtils")
class OpsPermissionUtilsTest {

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("requireOps — ROLE_ADMIN 만으로는 AccessDeniedException")
    void requireOps_adminOnly_throwsAccessDenied() {
        setAuthentication("admin-user", SecurityRoleConstants.ROLE_ADMIN);

        assertThrows(AccessDeniedException.class, OpsPermissionUtils::requireOps);
    }

    @Test
    @DisplayName("requireOps — ROLE_OPS 이면 통과")
    void requireOps_opsRole_ok() {
        setAuthentication("ops-user", SecurityRoleConstants.ROLE_OPS);

        assertDoesNotThrow(OpsPermissionUtils::requireOps);
    }

    private void setAuthentication(String principal, String authority) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal,
                "n/a",
                List.of(new SimpleGrantedAuthority(authority)));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
