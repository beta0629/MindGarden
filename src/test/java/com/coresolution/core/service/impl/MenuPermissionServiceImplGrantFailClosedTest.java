package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.MenuPermissionGrantRequest;
import com.coresolution.core.entity.Menu;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * MenuPermissionServiceImpl fail-closed grant gates.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuPermissionServiceImpl grant fail-closed")
class MenuPermissionServiceImplGrantFailClosedTest {

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
    @DisplayName("STAFF + ERP_FINANCIAL grant is rejected")
    void staffOpsFinanceRejected() {
        Menu menu = Menu.builder()
            .id(10L)
            .menuCode("ERP_FINANCIAL")
            .menuName("장부")
            .menuPath("/erp/financial")
            .minRequiredRole("ADMIN")
            .build();
        MenuPermissionGrantRequest req = MenuPermissionGrantRequest.builder()
            .roleId("STAFF")
            .menuId(10L)
            .canView(true)
            .build();

        assertThatThrownBy(() -> service.assertGrantAllowed("STAFF", menu, req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("운영·재무");
    }

    @Test
    @DisplayName("CONSULTANT + CST_SCHEDULE grant is rejected")
    void consultantScheduleCreateRejected() {
        Menu menu = Menu.builder()
            .id(20L)
            .menuCode("CST_SCHEDULE")
            .menuName("스케줄")
            .menuPath("/consultant/schedule")
            .minRequiredRole("CONSULTANT")
            .build();
        MenuPermissionGrantRequest req = MenuPermissionGrantRequest.builder()
            .roleId("CONSULTANT")
            .menuId(20L)
            .canView(true)
            .canCreate(true)
            .build();

        assertThatThrownBy(() -> service.assertGrantAllowed("CONSULTANT", menu, req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("스케줄");
    }

    @Test
    @DisplayName("STAFF may be granted schedule menu (proxy)")
    void staffScheduleAllowed() {
        Menu menu = Menu.builder()
            .id(20L)
            .menuCode("CST_SCHEDULE")
            .menuName("스케줄")
            .menuPath("/consultant/schedule")
            .minRequiredRole("CONSULTANT")
            .build();
        MenuPermissionGrantRequest req = MenuPermissionGrantRequest.builder()
            .roleId("STAFF")
            .menuId(20L)
            .canView(true)
            .canCreate(true)
            .build();

        service.assertGrantAllowed("STAFF", menu, req);
    }

    @Test
    @DisplayName("tenant role lookup rejects cross-tenant roleId")
    void crossTenantRoleRejected() {
        TenantRole role = TenantRole.builder()
            .tenantRoleId("role-1")
            .tenantId("tenant-B")
            .name("Staff")
            .nameEn("STAFF")
            .build();
        when(tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse("role-1"))
            .thenReturn(Optional.of(role));

        assertThatThrownBy(() -> service.resolveRoleCode("tenant-A", "role-1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("테넌트");
    }
}
