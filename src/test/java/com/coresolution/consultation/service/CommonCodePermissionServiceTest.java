package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.impl.AdminRoleUtilsMetaAdapter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CommonCodePermissionService} — 코어 권한은 {@link AdminRoleUtilsMetaAdapter} 경유.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodePermissionService")
class CommonCodePermissionServiceTest {

    private static final String TENANT_A = "tenant-a";

    @Mock
    private AdminRoleUtilsMetaAdapter adminRoleUtilsMetaAdapter;

    @InjectMocks
    private CommonCodePermissionService permissionService;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("코어 생성: 사용자 null 이면 거부")
    void canCreateCoreCode_nullUser_false() {
        assertFalse(permissionService.canCreateCoreCode(null));
    }

    @Test
    @DisplayName("코어 생성: 메타 어댑터가 true 이면 허용")
    void canCreateCoreCode_adapterAllows_true() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(true);

        assertTrue(permissionService.canCreateCoreCode(user));
    }

    @Test
    @DisplayName("코어 생성: 메타 어댑터가 false 이면 거부")
    void canCreateCoreCode_adapterDenies_false() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(false);

        assertFalse(permissionService.canCreateCoreCode(user));
    }

    @Test
    @DisplayName("테넌트 생성: 플랫폼(HQ) 권한이면 테넌트 무관 허용")
    void canCreateTenantCode_hqAdmin_true() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(true);

        assertTrue(permissionService.canCreateTenantCode(user, "other-tenant"));
    }

    @Test
    @DisplayName("테넌트 생성: 동일 테넌트 관리자 허용")
    void canCreateTenantCode_sameTenantAdmin_true() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(false);

        assertTrue(permissionService.canCreateTenantCode(user, TENANT_A));
    }

    @Test
    @DisplayName("테넌트 생성: 다른 테넌트 관리자 거부")
    void canCreateTenantCode_otherTenantAdmin_false() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(false);

        assertFalse(permissionService.canCreateTenantCode(user, "tenant-b"));
    }

    @Test
    @DisplayName("테넌트 생성: tenantId·컨텍스트 모두 비어 있으면 거부")
    void canCreateTenantCode_noTenantScope_false() {
        User user = adminUser(TENANT_A);
        when(adminRoleUtilsMetaAdapter.isHqAdmin(user)).thenReturn(false);
        TenantContextHolder.clear();

        assertFalse(permissionService.canCreateTenantCode(user, null));
    }

    private static User adminUser(String tenantId) {
        User user = User.builder()
            .userId("admin-perm-test")
            .email("admin-perm@test.example")
            .name("테스트")
            .role(UserRole.ADMIN)
            .build();
        user.setId(1L);
        user.setTenantId(tenantId);
        return user;
    }
}
