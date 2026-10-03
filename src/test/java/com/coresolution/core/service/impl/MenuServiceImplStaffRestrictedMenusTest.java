package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.core.constants.StaffRestrictedMenuCodes;
import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.repository.MenuRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link MenuServiceImpl} — STAFF 설정 메뉴 가시성 단위 테스트.
 *
 * <p>P0 보안(2026-10-03): STAFF 요청 시 {@code visibleRoles} 에 ADMIN 이 포함되어
 * 결제 연결(PG)·AI 프로바이더·시스템 설정 하위 메뉴까지 내려갔다. 코드 레벨 필터가
 * DB 행 상태(required_role drift)와 무관하게 이 세 항목을 제거하는지 검증한다.
 *
 * <p>메뉴 숨김만으로는 보안이 아니므로, 해당 메뉴 뒤 API 는 모두 ADMIN 전용으로
 * 별도 제한되어 있다 ({@code SystemConfigControllerAccessPolicyTest},
 * {@code TenantPgConfigurationControllerIntegrationTest}).
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MenuServiceImpl — STAFF 설정 메뉴 차단(PG·AI·시스템 설정·컴플라이언스)")
class MenuServiceImplStaffRestrictedMenusTest {

    private static final String MENU_LOCATION_ADMIN_ONLY = "ADMIN_ONLY";
    private static final String SETTINGS_GROUP_CODE = "ADM_SETTINGS";

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private MenuServiceImpl menuService;

    private long idCounter = 1;

    private Menu menu(String code, Long parentId, int depth, int sort, String role) {
        return Menu.builder()
                .id(idCounter++)
                .menuCode(code)
                .menuName(code)
                .menuPath("/admin/" + code.toLowerCase())
                .parentMenuId(parentId)
                .depth(depth)
                .requiredRole(role)
                .minRequiredRole(role)
                .isAdminOnly(true)
                .menuLocation(MENU_LOCATION_ADMIN_ONLY)
                .sortOrder(sort)
                .isActive(true)
                .build();
    }

    /**
     * 최악의 경우 fixture — 제한 대상 3종이 STAFF 로 drift 된 DB 행.
     */
    private List<Menu> buildDriftedMenus() {
        idCounter = 1;
        Menu dashboard = menu("ADM_DASHBOARD", null, 0, 10, "STAFF");
        Menu settings = menu(SETTINGS_GROUP_CODE, null, 0, 50, "STAFF");
        List<Menu> menus = new ArrayList<>(Arrays.asList(
                dashboard,
                settings,
                menu("ADM_PUSH_MONITORING", settings.getId(), 1, 12, "STAFF")));
        int sort = 20;
        for (String restricted : StaffRestrictedMenuCodes.ALL) {
            menus.add(menu(restricted, settings.getId(), 1, sort++, "STAFF"));
        }
        return menus;
    }

    private List<String> childCodes(List<MenuDTO> tree, String parentCode) {
        return tree.stream()
                .filter(m -> parentCode.equals(m.getMenuCode()))
                .findFirst()
                .map(m -> m.getChildren().stream().map(MenuDTO::getMenuCode).toList())
                .orElse(List.of());
    }

    @Test
    @DisplayName("STAFF — PG·AI·시스템 설정·컴플라이언스 메뉴가 제거된다 (DB 행이 STAFF 로 drift 된 경우에도)")
    void getLnbMenus_staff_excludesRestrictedSettingsMenus() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq(MENU_LOCATION_ADMIN_ONLY),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildDriftedMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("STAFF", Set.of());

        assertThat(childCodes(tree, SETTINGS_GROUP_CODE))
                .doesNotContainAnyElementsOf(StaffRestrictedMenuCodes.ALL)
                .contains("ADM_PUSH_MONITORING");
        assertThat(tree).extracting(MenuDTO::getMenuCode)
                .doesNotContainAnyElementsOf(StaffRestrictedMenuCodes.ALL);
    }

    @Test
    @DisplayName("ADMIN — PG·AI·시스템 설정·컴플라이언스 메뉴는 그대로 노출 (회귀 방지)")
    void getLnbMenus_admin_keepsRestrictedSettingsMenus() {
        when(menuRepository.findByMenuLocationAndRequiredRoleIn(
                eq(MENU_LOCATION_ADMIN_ONLY),
                org.mockito.ArgumentMatchers.anySet()))
                .thenReturn(buildDriftedMenus());

        List<MenuDTO> tree = menuService.getLnbMenus("ADMIN", null);

        assertThat(childCodes(tree, SETTINGS_GROUP_CODE))
                .containsAll(StaffRestrictedMenuCodes.ALL);
    }

    @Test
    @DisplayName("제한 목록 SSOT — PG·AI·시스템 설정·컴플라이언스 4종")
    void restrictedMenuCodes_areExactlyFour() {
        assertThat(StaffRestrictedMenuCodes.ALL).containsExactlyInAnyOrder(
                StaffRestrictedMenuCodes.ADM_SETTINGS_PG,
                StaffRestrictedMenuCodes.ADM_SETTINGS_AI_PROVIDER,
                StaffRestrictedMenuCodes.ADM_SETTINGS_SYSTEM,
                StaffRestrictedMenuCodes.ADM_REPORTS_COMP);
        assertThat(StaffRestrictedMenuCodes.isRestricted(StaffRestrictedMenuCodes.ADM_REPORTS_COMP)).isTrue();
        assertThat(StaffRestrictedMenuCodes.isRestricted(StaffRestrictedMenuCodes.ADM_SETTINGS_PG)).isTrue();
        assertThat(StaffRestrictedMenuCodes.isRestricted("ADM_DASHBOARD")).isFalse();
        assertThat(StaffRestrictedMenuCodes.isRestricted(null)).isFalse();
    }
}
