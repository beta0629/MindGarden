package com.coresolution.core.service.impl;

import com.coresolution.core.dto.MenuDTO;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * LNB 트리에 RoleMenuPermission.canView 필터 적용 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuPermissionServiceImpl — LNB RoleMenuPermission 필터")
class MenuPermissionServiceImplLnbFilterTest {

    private static final String TENANT = "tenant-a";
    private static final String ROLE_ID = "role-client-1";

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
    @DisplayName("canView=false 인 CLT_COMMUNITY 는 LNB 트리에서 제외(fail-closed)")
    void filterMenuTree_excludesCommunityWhenCanViewFalse() {
        Menu community = Menu.builder()
            .id(101L)
            .menuCode("CLT_COMMUNITY")
            .menuName("커뮤니티")
            .menuPath("/client/more/community")
            .minRequiredRole("CLIENT")
            .menuLocation("CLIENT")
            .isActive(true)
            .build();
        Menu dashboard = Menu.builder()
            .id(100L)
            .menuCode("CLT_DASHBOARD")
            .menuName("대시보드")
            .menuPath("/client/dashboard")
            .minRequiredRole("CLIENT")
            .menuLocation("CLIENT")
            .isActive(true)
            .build();

        when(menuRepository.findAllActiveMenusOrdered()).thenReturn(List.of(dashboard, community));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndIsActiveTrue(
            eq(TENANT), eq(ROLE_ID)))
            .thenReturn(List.of(
                RoleMenuPermission.builder()
                    .tenantId(TENANT)
                    .tenantRoleId(ROLE_ID)
                    .menuId(101L)
                    .canView(false)
                    .isActive(true)
                    .build()
            ));

        List<MenuDTO> tree = List.of(
            MenuDTO.builder().id(100L).menuCode("CLT_DASHBOARD").menuName("대시보드").build(),
            MenuDTO.builder().id(101L).menuCode("CLT_COMMUNITY").menuName("커뮤니티").build()
        );

        List<MenuDTO> filtered = service.filterMenuTreeByPermissions(
            tree, TENANT, ROLE_ID, "CLIENT");

        assertThat(filtered).extracting(MenuDTO::getMenuCode)
            .containsExactly("CLT_DASHBOARD");
    }

    @Test
    @DisplayName("권한 행이 없으면 min-role 기본으로 커뮤니티 유지")
    void filterMenuTree_keepsCommunityWhenNoPermissionRow() {
        Menu community = Menu.builder()
            .id(101L)
            .menuCode("CLT_COMMUNITY")
            .menuName("커뮤니티")
            .minRequiredRole("CLIENT")
            .isActive(true)
            .build();

        when(menuRepository.findAllActiveMenusOrdered()).thenReturn(List.of(community));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndIsActiveTrue(
            eq(TENANT), eq(ROLE_ID)))
            .thenReturn(List.of());

        List<MenuDTO> tree = List.of(
            MenuDTO.builder().id(101L).menuCode("CLT_COMMUNITY").menuName("커뮤니티").build()
        );

        List<MenuDTO> filtered = service.filterMenuTreeByPermissions(
            tree, TENANT, ROLE_ID, "CLIENT");

        assertThat(filtered).extracting(MenuDTO::getMenuCode)
            .containsExactly("CLT_COMMUNITY");
    }

    @Test
    @DisplayName("다른 tenantId 권한 행은 조회되지 않아 기본 노출 유지(테넌트 격리)")
    void filterMenuTree_ignoresOtherTenantPermissionsViaRepositoryScope() {
        Menu community = Menu.builder()
            .id(101L)
            .menuCode("CLT_COMMUNITY")
            .menuName("커뮤니티")
            .minRequiredRole("CLIENT")
            .isActive(true)
            .build();

        when(menuRepository.findAllActiveMenusOrdered()).thenReturn(List.of(community));
        when(roleMenuPermissionRepository.findByTenantIdAndTenantRoleIdAndIsActiveTrue(
            eq(TENANT), eq(ROLE_ID)))
            .thenReturn(List.of());

        List<MenuDTO> filtered = service.filterMenuTreeByPermissions(
            List.of(MenuDTO.builder().id(101L).menuCode("CLT_COMMUNITY").build()),
            TENANT,
            ROLE_ID,
            "CLIENT"
        );

        assertThat(filtered).hasSize(1);
    }
}
