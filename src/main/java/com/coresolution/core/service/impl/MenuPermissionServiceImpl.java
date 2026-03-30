package com.coresolution.core.service.impl;

import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.dto.MenuPermissionDTO;
import com.coresolution.core.dto.MenuPermissionGrantRequest;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.entity.RoleMenuPermission;
import com.coresolution.core.repository.MenuRepository;
import com.coresolution.core.repository.RoleMenuPermissionRepository;
import com.coresolution.core.service.MenuPermissionService;
import com.coresolution.core.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 메뉴 권한 서비스 구현체
 * 
 * @author MindGarden
 * @version 2.0.0
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

    // 역할 계층 (숫자가 높을수록 권한이 큼)
    private static final Map<String, Integer> ROLE_HIERARCHY = Map.of(
        "ADMIN", 4,
        "STAFF", 3,
        "CONSULTANT", 2,
        "CLIENT", 1
    );

    @Override
    public List<MenuPermissionDTO> getRoleMenuPermissions(String tenantId, String roleId) {
        log.debug("역할별 메뉴 권한 조회: tenantId={}, roleId={}", tenantId, roleId);

        // 1. 모든 활성 메뉴 조회
        List<Menu> allMenus = menuRepository.findAllActiveMenusOrdered();

        // 2. 역할의 현재 권한 조회
        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);

        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId,
                p -> p,
                (existing, replacement) -> existing
            ));

        // 3. DTO 변환
        return allMenus.stream()
            .map(menu -> {
                RoleMenuPermission permission = permissionMap.get(menu.getId());

                return MenuPermissionDTO.builder()
                    .menuId(menu.getId())
                    .menuCode(menu.getMenuCode())
                    .menuName(menu.getMenuName())
                    .menuPath(menu.getMenuPath())
                    .minRequiredRole(menu.getMinRequiredRole())
                    .menuLocation(menu.getMenuLocation())
                    .hasPermission(permission != null)
                    .canView(permission != null ? permission.getCanView() : false)
                    .canCreate(permission != null ? permission.getCanCreate() : false)
                    .canUpdate(permission != null ? permission.getCanUpdate() : false)
                    .canDelete(permission != null ? permission.getCanDelete() : false)
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void grantMenuPermission(String tenantId, MenuPermissionGrantRequest request) {
        log.info("메뉴 권한 부여: tenantId={}, roleId={}, menuId={}", 
            tenantId, request.getRoleId(), request.getMenuId());

        // 1. 메뉴 조회 및 존재 확인
        Menu menu = menuRepository.findByIdAndIsActiveTrue(request.getMenuId())
            .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다: " + request.getMenuId()));

        // 2. 권한 확인 (최소 요구 역할보다 낮은 역할에게는 부여 불가)
        // TODO: tenant_roles 테이블에서 역할 정보 조회 후 menu.getMinRequiredRole()과 비교하여 권한 확인
        // 현재는 모든 권한 부여 허용 (추후 구현)
        log.debug("메뉴 정보: menuCode={}, minRequiredRole={}", menu.getMenuCode(), menu.getMinRequiredRole());

        // 3. 기존 권한 확인
        Optional<RoleMenuPermission> existing = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndMenuId(tenantId, request.getRoleId(), request.getMenuId());

        if (existing.isPresent()) {
            // 수정
            RoleMenuPermission permission = existing.get();
            permission.setCanView(request.getCanView());
            permission.setCanCreate(request.getCanCreate());
            permission.setCanUpdate(request.getCanUpdate());
            permission.setCanDelete(request.getCanDelete());
            permission.setIsActive(true);

            roleMenuPermissionRepository.save(permission);
        } else {
            // 신규 생성
            RoleMenuPermission permission = RoleMenuPermission.builder()
                .tenantId(tenantId)
                .tenantRoleId(request.getRoleId())
                .menuId(request.getMenuId())
                .canView(request.getCanView())
                .canCreate(request.getCanCreate())
                .canUpdate(request.getCanUpdate())
                .canDelete(request.getCanDelete())
                .isActive(true)
                .assignedBy("SYSTEM") // TODO: 실제 사용자 ID으로 변경
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
            try {
                request.setRoleId(roleId);
                grantMenuPermission(tenantId, request);
            } catch (Exception e) {
                log.error("메뉴 권한 부여 실패: menuId={}", request.getMenuId(), e);
            }
        }

        log.info("메뉴 권한 일괄 업데이트 완료");
    }

    @Override
    public List<MenuDTO> getUserAccessibleMenus(String tenantId, String roleId, String userRole) {
        log.debug("사용자 접근 가능한 메뉴 조회: tenantId={}, roleId={}, userRole={}", tenantId, roleId, userRole);

        // 1. 모든 활성 메뉴 조회
        List<Menu> allMenus = menuRepository.findAllActiveMenusOrdered();

        // 2. 역할별 권한 조회
        List<RoleMenuPermission> permissions = roleMenuPermissionRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, roleId);

        Map<Long, RoleMenuPermission> permissionMap = permissions.stream()
            .collect(Collectors.toMap(
                RoleMenuPermission::getMenuId,
                p -> p,
                (existing, replacement) -> existing
            ));

        // 3. 접근 가능한 메뉴 필터링
        List<Menu> accessibleMenus = allMenus.stream()
            .filter(menu -> canAccessMenu(userRole, menu, permissionMap))
            .collect(Collectors.toList());

        // 4. 계층 구조로 변환 (MenuService 활용)
        return menuService.getAllActiveMenus().stream()
            .filter(menuDTO -> accessibleMenus.stream()
                .anyMatch(menu -> menu.getId().equals(menuDTO.getId())))
            .collect(Collectors.toList());
    }

    /**
     * 메뉴 접근 가능 여부 확인
     */
    private boolean canAccessMenu(String userRole, Menu menu, Map<Long, RoleMenuPermission> permissionMap) {
        // 1. 명시적 권한이 있는 경우
        RoleMenuPermission permission = permissionMap.get(menu.getId());
        if (permission != null) {
            return Boolean.TRUE.equals(permission.getCanView());
        }

        // 2. 명시적 권한이 없는 경우 - 최소 요구 역할 확인
        return checkMinRequiredRole(userRole, menu.getMinRequiredRole());
    }

    /**
     * 최소 요구 역할 확인
     */
    private boolean checkMinRequiredRole(String userRole, String minRequiredRole) {
        int userLevel = ROLE_HIERARCHY.getOrDefault(userRole, 0);
        int requiredLevel = ROLE_HIERARCHY.getOrDefault(minRequiredRole, 0);

        return userLevel >= requiredLevel;
    }
}

