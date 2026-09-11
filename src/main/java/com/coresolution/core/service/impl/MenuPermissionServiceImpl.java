package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.dto.MenuPermissionDTO;
import com.coresolution.core.dto.MenuPermissionGrantRequest;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.entity.RoleMenuPermission;
import com.coresolution.core.repository.MenuRepository;
import com.coresolution.core.repository.RoleMenuPermissionRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.MenuPermissionService;
import com.coresolution.core.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 메뉴 권한 서비스 구현체
 *
 * <p>Fail-closed: STAFF + ops finance, CONSULTANT + schedule-create, min-role.</p>
 *
 * @author MindGarden
 * @version 2.1.0
 * @since 2025-12-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuPermissionServiceImpl implements MenuPermissionService {

    private final MenuRepository menuRepository;
    private final RoleMenuPermissionRepository roleMenuPermissionRepository;
    private final MenuService menuService;
    private final TenantRoleRepository tenantRoleRepository;

    private static final Map<String, Integer> ROLE_HIERARCHY = Map.of(
        "ADMIN", 4,
        "STAFF", 3,
        "CONSULTANT", 2,
        "CLIENT", 1
    );

    /** STAFF 운영·재무 — ledger / this-month / tax / salary approve-pay */
    static final Set<String> STAFF_OPS_FINANCE_MENU_CODES = Set.of(
        "ADM_ERP",
        "ERP_DASHBOARD",
        "ERP_FINANCIAL",
        "ERP_TAX",
        "ERP_SALARY",
        "ERP_APPROVALS"
    );

    static final Set<String> SCHEDULE_CREATE_MENU_CODES = Set.of("CST_SCHEDULE");

    private static final String MSG_STAFF_OPS_FINANCE =
        "스태프에게 운영·재무(장부·이번 달·세금·급여 승인·지급) 권한을 줄 수 없습니다.";
    private static final String MSG_SCHEDULE_CREATE =
        "상담사는 스케줄을 생성할 수 없습니다. 센터·스태프가 대리 등록합니다.";
    private static final String MSG_MIN_ROLE =
        "이 역할보다 높은 최소 역할이 필요한 메뉴입니다.";

    @Override
    public List<MenuPermissionDTO> getRoleMenuPermissions(String tenantId, String roleId) {
        log.debug("역할별 메뉴 권한 조회: tenantId={}, roleId={}", tenantId, roleId);

        List<Menu> allMenus = menuRepository.findAllActiveMenusOrdered();

        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);

        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId,
                p -> p,
                (existing, replacement) -> existing
            ));

        String roleCode = resolveRoleCode(tenantId, roleId);

        return allMenus.stream()
            .map(menu -> {
                RoleMenuPermission permission = permissionMap.get(menu.getId());
                boolean defaultCanView = checkMinRequiredRole(roleCode, menu.getMinRequiredRole());

                return MenuPermissionDTO.builder()
                    .menuId(menu.getId())
                    .menuCode(menu.getMenuCode())
                    .menuName(menu.getMenuName())
                    .menuPath(menu.getMenuPath())
                    .minRequiredRole(menu.getMinRequiredRole())
                    .menuLocation(menu.getMenuLocation())
                    .hasPermission(permission != null)
                    .canView(permission != null ? Boolean.TRUE.equals(permission.getCanView()) : defaultCanView)
                    .canCreate(permission != null ? Boolean.TRUE.equals(permission.getCanCreate()) : false)
                    .canUpdate(permission != null ? Boolean.TRUE.equals(permission.getCanUpdate()) : false)
                    .canDelete(permission != null ? Boolean.TRUE.equals(permission.getCanDelete()) : false)
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void grantMenuPermission(String tenantId, MenuPermissionGrantRequest request) {
        log.info("메뉴 권한 부여: tenantId={}, roleId={}, menuId={}",
            tenantId, request.getRoleId(), request.getMenuId());

        Menu menu = menuRepository.findByIdAndIsActiveTrue(request.getMenuId())
            .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다: " + request.getMenuId()));

        String roleCode = resolveRoleCode(tenantId, request.getRoleId());
        assertGrantAllowed(roleCode, menu, request);

        Optional<RoleMenuPermission> existing = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndMenuId(tenantId, request.getRoleId(), request.getMenuId());

        if (existing.isPresent()) {
            RoleMenuPermission permission = existing.get();
            permission.setCanView(request.getCanView());
            permission.setCanCreate(Boolean.TRUE.equals(request.getCanCreate()));
            permission.setCanUpdate(Boolean.TRUE.equals(request.getCanUpdate()));
            permission.setCanDelete(Boolean.TRUE.equals(request.getCanDelete()));
            permission.setIsActive(true);
            roleMenuPermissionRepository.save(permission);
        } else {
            RoleMenuPermission permission = RoleMenuPermission.builder()
                .tenantId(tenantId)
                .tenantRoleId(request.getRoleId())
                .menuId(request.getMenuId())
                .canView(request.getCanView())
                .canCreate(Boolean.TRUE.equals(request.getCanCreate()))
                .canUpdate(Boolean.TRUE.equals(request.getCanUpdate()))
                .canDelete(Boolean.TRUE.equals(request.getCanDelete()))
                .isActive(true)
                .assignedBy("SYSTEM")
                .build();
            roleMenuPermissionRepository.save(permission);
        }

        log.info("메뉴 권한 부여 완료");
    }

    @Override
    @Transactional
    public void revokeMenuPermission(String tenantId, String roleId, Long menuId) {
        log.info("메뉴 권한 회수: tenantId={}, roleId={}, menuId={}", tenantId, roleId, menuId);

        RoleMenuPermission permission = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndMenuId(tenantId, roleId, menuId)
            .orElseThrow(() -> new IllegalArgumentException("권한을 찾을 수 없습니다"));

        permission.setIsActive(false);
        roleMenuPermissionRepository.save(permission);

        log.info("메뉴 권한 회수 완료");
    }

    @Override
    @Transactional
    public void batchUpdateMenuPermissions(String tenantId, String roleId, List<MenuPermissionGrantRequest> requests) {
        log.info("메뉴 권한 일괄 업데이트: tenantId={}, roleId={}, count={}", tenantId, roleId, requests.size());

        for (MenuPermissionGrantRequest request : requests) {
            request.setRoleId(roleId);
            grantMenuPermission(tenantId, request);
        }

        log.info("메뉴 권한 일괄 업데이트 완료");
    }

    @Override
    public List<MenuDTO> getUserAccessibleMenus(String tenantId, String roleId, String userRole) {
        log.debug("사용자 접근 가능한 메뉴 조회: tenantId={}, roleId={}, userRole={}", tenantId, roleId, userRole);

        List<Menu> allMenus = menuRepository.findAllActiveMenusOrdered();

        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);

        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId,
                p -> p,
                (existing, replacement) -> existing
            ));

        List<Menu> accessibleMenus = allMenus.stream()
            .filter(menu -> canAccessMenu(userRole, menu, permissionMap))
            .collect(Collectors.toList());

        return menuService.getAllActiveMenus().stream()
            .filter(menuDTO -> accessibleMenus.stream()
                .anyMatch(menu -> menu.getId().equals(menuDTO.getId())))
            .collect(Collectors.toList());
    }

    @Override
    public List<MenuDTO> filterMenuTreeByPermissions(
        List<MenuDTO> tree,
        String tenantId,
        String roleId,
        String userRole
    ) {
        if (tree == null || tree.isEmpty()) {
            return new ArrayList<>();
        }
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(roleId)) {
            log.warn("RoleMenuPermission LNB 필터 스킵: tenantId 또는 roleId 없음");
            return tree;
        }

        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);

        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId,
                p -> p,
                (existing, replacement) -> existing
            ));

        Map<Long, Menu> menuById = menuRepository.findAllActiveMenusOrdered().stream()
            .collect(Collectors.toMap(Menu::getId, m -> m, (a, b) -> a));

        return filterMenuTreeRecursive(tree, userRole, permissionMap, menuById);
    }

    @Override
    public String resolveTenantRoleIdForRoleCode(String tenantId, String roleCode) {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(roleCode)) {
            return null;
        }
        String normalized = normalizeRoleCode(roleCode);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        return tenantRoleRepository
            .findByTenantIdAndNameEnAndIsDeletedFalse(tenantId, normalized)
            .map(TenantRole::getTenantRoleId)
            .orElse(null);
    }

    private List<MenuDTO> filterMenuTreeRecursive(
        List<MenuDTO> menus,
        String userRole,
        Map<Long, RoleMenuPermission> permissionMap,
        Map<Long, Menu> menuById
    ) {
        if (menus == null || menus.isEmpty()) {
            return new ArrayList<>();
        }

        List<MenuDTO> filtered = new ArrayList<>();
        for (MenuDTO menu : menus) {
            if (menu == null) {
                continue;
            }
            List<MenuDTO> childFiltered = filterMenuTreeRecursive(
                menu.getChildren(),
                userRole,
                permissionMap,
                menuById
            );
            boolean selfAllowed = canAccessMenuDto(userRole, menu, permissionMap, menuById);
            if (!selfAllowed && childFiltered.isEmpty()) {
                continue;
            }
            MenuDTO copy = copyMenuNode(menu);
            copy.setChildren(childFiltered);
            filtered.add(copy);
        }
        return filtered;
    }

    private boolean canAccessMenuDto(
        String userRole,
        MenuDTO menuDto,
        Map<Long, RoleMenuPermission> permissionMap,
        Map<Long, Menu> menuById
    ) {
        if (menuDto == null || menuDto.getId() == null) {
            return false;
        }
        Menu entity = menuById.get(menuDto.getId());
        if (entity != null) {
            return canAccessMenu(userRole, entity, permissionMap);
        }
        RoleMenuPermission permission = permissionMap.get(menuDto.getId());
        if (permission != null) {
            return Boolean.TRUE.equals(permission.getCanView());
        }
        // 엔티티를 못 찾았고 권한 행도 없으면 LNB location 필터 결과를 유지
        return true;
    }

    private static MenuDTO copyMenuNode(MenuDTO source) {
        return MenuDTO.builder()
            .id(source.getId())
            .menuCode(source.getMenuCode())
            .menuName(source.getMenuName())
            .menuNameEn(source.getMenuNameEn())
            .menuPath(source.getMenuPath())
            .parentMenuId(source.getParentMenuId())
            .depth(source.getDepth())
            .requiredRole(source.getRequiredRole())
            .isAdminOnly(source.getIsAdminOnly())
            .icon(source.getIcon())
            .description(source.getDescription())
            .sortOrder(source.getSortOrder())
            .isActive(source.getIsActive())
            .children(new ArrayList<>())
            .build();
    }

    /**
     * Fail-closed grant gate.
     */
    void assertGrantAllowed(String roleCode, Menu menu, MenuPermissionGrantRequest request) {
        String normalized = normalizeRoleCode(roleCode);

        if ("STAFF".equals(normalized) && isOpsFinanceMenu(menu)) {
            throw new IllegalArgumentException(MSG_STAFF_OPS_FINANCE);
        }

        if ("CONSULTANT".equals(normalized) && isScheduleCreateMenu(menu)) {
            if (Boolean.TRUE.equals(request.getCanView())
                    || Boolean.TRUE.equals(request.getCanCreate())
                    || Boolean.TRUE.equals(request.getCanUpdate())
                    || Boolean.TRUE.equals(request.getCanDelete())) {
                throw new IllegalArgumentException(MSG_SCHEDULE_CREATE);
            }
        }

        if (!checkMinRequiredRole(normalized, menu.getMinRequiredRole())) {
            throw new IllegalArgumentException(MSG_MIN_ROLE);
        }
    }

    static boolean isOpsFinanceMenu(Menu menu) {
        if (menu == null) {
            return false;
        }
        String code = menu.getMenuCode();
        if (code != null && STAFF_OPS_FINANCE_MENU_CODES.contains(code)) {
            return true;
        }
        String path = menu.getMenuPath() == null ? "" : menu.getMenuPath().toLowerCase(Locale.ROOT);
        return path.contains("/erp/dashboard")
            || path.contains("/erp/financial")
            || path.contains("/erp/tax")
            || path.contains("/erp/salary")
            || path.contains("/erp/approvals");
    }

    static boolean isScheduleCreateMenu(Menu menu) {
        if (menu == null) {
            return false;
        }
        String code = menu.getMenuCode();
        if (code != null && SCHEDULE_CREATE_MENU_CODES.contains(code)) {
            return true;
        }
        String path = menu.getMenuPath() == null ? "" : menu.getMenuPath().toLowerCase(Locale.ROOT);
        if (path.contains("/consultant/schedule")) {
            return true;
        }
        String name = menu.getMenuName() == null ? "" : menu.getMenuName();
        return name.contains("스케줄 생성") || name.contains("스케줄 등록");
    }

    String resolveRoleCode(String tenantId, String roleId) {
        if (!StringUtils.hasText(roleId)) {
            return "";
        }
        // Mock / direct role codes
        String direct = normalizeRoleCode(roleId);
        if (ROLE_HIERARCHY.containsKey(direct)) {
            return direct;
        }
        Optional<TenantRole> roleOpt = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(roleId);
        if (roleOpt.isEmpty()) {
            log.warn("TenantRole not found for grant gate: tenantId={}, roleId={}", tenantId, roleId);
            return "";
        }
        TenantRole role = roleOpt.get();
        if (StringUtils.hasText(tenantId) && !tenantId.equals(role.getTenantId())) {
            throw new IllegalArgumentException("테넌트 정보가 일치하지 않습니다.");
        }
        return normalizeRoleCode(role.getNameEn());
    }

    static String normalizeRoleCode(String nameEn) {
        if (!StringUtils.hasText(nameEn)) {
            return "";
        }
        String raw = nameEn.trim().toUpperCase(Locale.ROOT);
        return switch (raw) {
            case "ADMIN", "DIRECTOR", "원장" -> "ADMIN";
            case "STAFF", "사무원" -> "STAFF";
            case "CONSULTANT", "COUNSELOR", "상담사" -> "CONSULTANT";
            case "CLIENT", "내담자" -> "CLIENT";
            default -> raw;
        };
    }

    private boolean canAccessMenu(String userRole, Menu menu, Map<Long, RoleMenuPermission> permissionMap) {
        RoleMenuPermission permission = permissionMap.get(menu.getId());
        if (permission != null) {
            return Boolean.TRUE.equals(permission.getCanView());
        }
        return checkMinRequiredRole(userRole, menu.getMinRequiredRole());
    }

    private boolean checkMinRequiredRole(String userRole, String minRequiredRole) {
        int userLevel = ROLE_HIERARCHY.getOrDefault(normalizeRoleCode(userRole), 0);
        int requiredLevel = ROLE_HIERARCHY.getOrDefault(normalizeRoleCode(minRequiredRole), 0);
        return userLevel >= requiredLevel;
    }
}
