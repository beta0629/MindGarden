package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.IosReviewModeResponse;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * iOS 심사 모드 원버튼 — CLIENT/CONSULTANT 커뮤니티 canViewIos만 변경.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuPermissionServiceImpl iOS review mode")
class MenuPermissionServiceImplIosReviewModeTest {

    private static final String TENANT = "tenant-a";
    private static final String CLIENT_ROLE_ID = "role-client";
    private static final String CONSULTANT_ROLE_ID = "role-consultant";

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
    @DisplayName("enabled=true → CLT/CST 커뮤니티 canViewIos=false, android/web 불변")
    void setIosReviewMode_hidesIosOnly() {
        stubRolesAndMenus();
        RoleMenuPermission clientPerm = existingPermission(CLIENT_ROLE_ID, 101L, true, true, true);
        RoleMenuPermission consultantPerm = existingPermission(CONSULTANT_ROLE_ID, 201L, true, true, false);

        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(clientPerm));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(consultantPerm));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        IosReviewModeResponse response = service.setIosReviewMode(TENANT, true);

        assertThat(clientPerm.getCanViewIos()).isFalse();
        assertThat(clientPerm.getCanView()).isTrue();
        assertThat(clientPerm.getCanViewAndroid()).isTrue();
        assertThat(consultantPerm.getCanViewIos()).isFalse();
        assertThat(consultantPerm.getCanView()).isTrue();
        assertThat(consultantPerm.getCanViewAndroid()).isFalse();
        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getUpdatedCount()).isEqualTo(2);
        verify(roleMenuPermissionRepository, times(2)).save(any(RoleMenuPermission.class));
    }

    @Test
    @DisplayName("enabled=false → CLT/CST 커뮤니티 canViewIos=true 복구")
    void setIosReviewMode_restoresIos() {
        stubRolesAndMenus();
        RoleMenuPermission clientPerm = existingPermission(CLIENT_ROLE_ID, 101L, true, false, true);
        RoleMenuPermission consultantPerm = existingPermission(CONSULTANT_ROLE_ID, 201L, false, false, true);

        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(clientPerm));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(consultantPerm));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        IosReviewModeResponse response = service.setIosReviewMode(TENANT, false);

        assertThat(clientPerm.getCanViewIos()).isTrue();
        assertThat(clientPerm.getCanViewAndroid()).isTrue();
        assertThat(consultantPerm.getCanViewIos()).isTrue();
        assertThat(consultantPerm.getCanView()).isFalse();
        assertThat(response.isEnabled()).isFalse();
        assertThat(response.getUpdatedCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("권한 행 없으면 생성하되 android/web은 min-role 기본")
    void setIosReviewMode_createsMissingRows() {
        stubRolesAndMenus();
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(existingPermission(CLIENT_ROLE_ID, 101L, true, false, true)));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(existingPermission(CONSULTANT_ROLE_ID, 201L, true, false, true)));
        when(tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(CLIENT_ROLE_ID))
            .thenReturn(Optional.of(TenantRole.builder()
                .tenantId(TENANT)
                .tenantRoleId(CLIENT_ROLE_ID)
                .nameEn("CLIENT")
                .build()));
        when(tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(CONSULTANT_ROLE_ID))
            .thenReturn(Optional.of(TenantRole.builder()
                .tenantId(TENANT)
                .tenantRoleId(CONSULTANT_ROLE_ID)
                .nameEn("CONSULTANT")
                .build()));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        IosReviewModeResponse response = service.setIosReviewMode(TENANT, true);

        ArgumentCaptor<RoleMenuPermission> captor = ArgumentCaptor.forClass(RoleMenuPermission.class);
        verify(roleMenuPermissionRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(p -> {
            assertThat(p.getCanViewIos()).isFalse();
            assertThat(p.getCanView()).isTrue();
            assertThat(p.getCanViewAndroid()).isTrue();
        });
        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getUpdatedCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("getIosReviewMode: 한쪽만 iOS OFF이면 enabled=false")
    void getIosReviewMode_requiresBothRolesHidden() {
        stubRolesAndMenus();
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(existingPermission(CLIENT_ROLE_ID, 101L, true, false, true)));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(existingPermission(CONSULTANT_ROLE_ID, 201L, true, true, true)));

        IosReviewModeResponse response = service.getIosReviewMode(TENANT);

        assertThat(response.isEnabled()).isFalse();
        verify(roleMenuPermissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("getIosReviewMode: CLT/CST 모두 iOS OFF이면 enabled=true")
    void getIosReviewMode_bothHidden_enabledTrue() {
        stubRolesAndMenus();
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(existingPermission(CLIENT_ROLE_ID, 101L, true, false, true)));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(existingPermission(CONSULTANT_ROLE_ID, 201L, true, false, false)));

        IosReviewModeResponse response = service.getIosReviewMode(TENANT);

        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getUpdatedCount()).isZero();
        verify(roleMenuPermissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("이미 iOS OFF이면 재적용 시 updatedCount=0 (멱등)")
    void setIosReviewMode_idempotentWhenAlreadyHidden() {
        stubRolesAndMenus();
        RoleMenuPermission clientPerm = existingPermission(CLIENT_ROLE_ID, 101L, true, false, true);
        RoleMenuPermission consultantPerm = existingPermission(CONSULTANT_ROLE_ID, 201L, true, false, true);

        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(clientPerm));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(consultantPerm));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        IosReviewModeResponse response = service.setIosReviewMode(TENANT, true);

        assertThat(clientPerm.getCanViewIos()).isFalse();
        assertThat(clientPerm.getCanViewAndroid()).isTrue();
        assertThat(consultantPerm.getCanViewIos()).isFalse();
        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getUpdatedCount()).isZero();
    }

    @Test
    @DisplayName("CLIENT 역할 없어도 CONSULTANT만 갱신하고 예외 없음")
    void setIosReviewMode_skipsMissingClientRole() {
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(TENANT, "CLIENT"))
            .thenReturn(Optional.empty());
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(TENANT, "CONSULTANT"))
            .thenReturn(Optional.of(TenantRole.builder()
                .tenantId(TENANT)
                .tenantRoleId(CONSULTANT_ROLE_ID)
                .nameEn("CONSULTANT")
                .build()));
        when(menuRepository.findByMenuCode("CST_COMMUNITY"))
            .thenReturn(Optional.of(Menu.builder()
                .id(201L)
                .menuCode("CST_COMMUNITY")
                .menuName("커뮤니티")
                .minRequiredRole("CONSULTANT")
                .isActive(true)
                .build()));
        RoleMenuPermission consultantPerm = existingPermission(CONSULTANT_ROLE_ID, 201L, true, true, true);
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(consultantPerm));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        IosReviewModeResponse response = service.setIosReviewMode(TENANT, true);

        assertThat(consultantPerm.getCanViewIos()).isFalse();
        assertThat(consultantPerm.getCanViewAndroid()).isTrue();
        assertThat(response.getUpdatedCount()).isEqualTo(1);
        verify(menuRepository, never()).findByMenuCode("CLT_COMMUNITY");
        verify(menuRepository, never()).findByMenuCode("ADM_COMMUNITY_MODERATION");
    }

    @Test
    @DisplayName("원버튼은 CLT/CST 커뮤니티만 조회 — ADM_COMMUNITY_MODERATION 미대상")
    void setIosReviewMode_neverTouchesAdminModerationMenu() {
        stubRolesAndMenus();
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CLIENT_ROLE_ID), eq(101L)))
            .thenReturn(Optional.of(existingPermission(CLIENT_ROLE_ID, 101L, true, true, true)));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndMenuId(
            eq(TENANT), eq(CONSULTANT_ROLE_ID), eq(201L)))
            .thenReturn(Optional.of(existingPermission(CONSULTANT_ROLE_ID, 201L, true, true, true)));
        when(roleMenuPermissionRepository.save(any(RoleMenuPermission.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        service.setIosReviewMode(TENANT, true);

        verify(menuRepository, times(2)).findByMenuCode("CLT_COMMUNITY");
        verify(menuRepository, times(2)).findByMenuCode("CST_COMMUNITY");
        verify(menuRepository, never()).findByMenuCode("ADM_COMMUNITY_MODERATION");
    }

    @Test
    @DisplayName("tenantId 공백이면 IllegalArgumentException")
    void setIosReviewMode_blankTenant_throws() {
        org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> service.setIosReviewMode("  ", true)
        );
        verify(roleMenuPermissionRepository, never()).save(any());
    }

    private void stubRolesAndMenus() {
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(TENANT, "CLIENT"))
            .thenReturn(Optional.of(TenantRole.builder()
                .tenantId(TENANT)
                .tenantRoleId(CLIENT_ROLE_ID)
                .nameEn("CLIENT")
                .build()));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(TENANT, "CONSULTANT"))
            .thenReturn(Optional.of(TenantRole.builder()
                .tenantId(TENANT)
                .tenantRoleId(CONSULTANT_ROLE_ID)
                .nameEn("CONSULTANT")
                .build()));
        when(menuRepository.findByMenuCode("CLT_COMMUNITY"))
            .thenReturn(Optional.of(Menu.builder()
                .id(101L)
                .menuCode("CLT_COMMUNITY")
                .menuName("커뮤니티")
                .minRequiredRole("CLIENT")
                .isActive(true)
                .build()));
        when(menuRepository.findByMenuCode("CST_COMMUNITY"))
            .thenReturn(Optional.of(Menu.builder()
                .id(201L)
                .menuCode("CST_COMMUNITY")
                .menuName("커뮤니티")
                .minRequiredRole("CONSULTANT")
                .isActive(true)
                .build()));
    }

    private static RoleMenuPermission existingPermission(
        String roleId,
        Long menuId,
        boolean canView,
        boolean canViewIos,
        boolean canViewAndroid
    ) {
        return RoleMenuPermission.builder()
            .tenantId(TENANT)
            .tenantRoleId(roleId)
            .menuId(menuId)
            .canView(canView)
            .canViewIos(canViewIos)
            .canViewAndroid(canViewAndroid)
            .isActive(true)
            .build();
    }
}
