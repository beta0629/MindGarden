package com.coresolution.core.service.impl;

import com.coresolution.core.dto.MenuPermissionGrantRequest;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.entity.RoleMenuPermission;
import com.coresolution.core.repository.MenuRepository;
import com.coresolution.core.repository.RoleMenuPermissionRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.MenuService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Grant 부분 갱신(canViewIos/canViewAndroid null = 미변경) 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuPermissionServiceImpl grant partial platform update")
class MenuPermissionServiceImplGrantPartialUpdateTest {

    private static final String TENANT = "tenant-a";
    private static final String ROLE_ID = "CLIENT";

    @Mock
    private MenuRepository menuRepository;
    @Mock
    private RoleMenuPermissionRepository roleMenuPermissionRepository;
    @Mock
    private MenuService menuService;
    @Mock
    private TenantRoleRepository tenantRoleRepository;

    private MenuPermissionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new MenuPermissionServiceImpl(
            menuRepository,
            roleMenuPermissionRepository,
            menuService,
            tenantRoleRepository
        );
    }

    @Test
    @DisplayName("canViewIos만 전달 시 android·web 값은 유지")
    void grant_partialUpdate_iosOnlyKeepsAndroidAndWeb() {
        Menu menu = Menu.builder()
            .id(101L)
            .menuCode("CLT_COMMUNITY")
            .menuName("커뮤니티")
            .minRequiredRole("CLIENT")
            .isActive(true)
            .build();
        when(menuRepository.findByIdAndIsActiveTrue(101L)).thenReturn(Optional.of(menu));

        RoleMenuPermission existing = RoleMenuPermission.builder()
            .id(1L)
            .tenantId(TENANT)
            .tenantRoleId(ROLE_ID)
            .menuId(101L)
            .canView(true)
            .canViewIos(true)
            .canViewAndroid(true)
            .canCreate(false)
            .canUpdate(false)
            .canDelete(false)
            .isActive(true)
            .build();
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            TENANT, ROLE_ID, 101L))
            .thenReturn(Optional.of(existing));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        MenuPermissionGrantRequest req = MenuPermissionGrantRequest.builder()
            .roleId(ROLE_ID)
            .menuId(101L)
            .canViewIos(false)
            .build();

        service.grantMenuPermission(TENANT, req);

        ArgumentCaptor<RoleMenuPermission> captor = ArgumentCaptor.forClass(RoleMenuPermission.class);
        verify(roleMenuPermissionRepository).save(captor.capture());
        RoleMenuPermission saved = captor.getValue();
        assertThat(saved.getCanViewIos()).isFalse();
        assertThat(saved.getCanViewAndroid()).isTrue();
        assertThat(saved.getCanView()).isTrue();
    }

    @Test
    @DisplayName("applyPartialGrant: null 필드는 건드리지 않음")
    void applyPartialGrant_nullFieldsUnchanged() {
        RoleMenuPermission permission = RoleMenuPermission.builder()
            .canView(true)
            .canViewIos(false)
            .canViewAndroid(true)
            .canCreate(true)
            .build();
        MenuPermissionGrantRequest req = MenuPermissionGrantRequest.builder()
            .canViewAndroid(false)
            .build();

        MenuPermissionServiceImpl.applyPartialGrant(permission, req);

        assertThat(permission.getCanView()).isTrue();
        assertThat(permission.getCanViewIos()).isFalse();
        assertThat(permission.getCanViewAndroid()).isFalse();
        assertThat(permission.getCanCreate()).isTrue();
    }
}
