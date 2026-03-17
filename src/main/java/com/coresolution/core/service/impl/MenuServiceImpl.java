package com.coresolution.core.service.impl;

import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.entity.Menu;
import com.coresolution.core.repository.MenuRepository;
import com.coresolution.core.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 메뉴 서비스 구현체
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@Service("coreMenuService") // Bean 이름 명시 (consultation.MenuServiceImpl과 충돌 방지)
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuServiceImpl implements MenuService {

    private final MenuRepository menuRepository;

    @Override
    public List<MenuDTO> getMenusByRole(String role) {
        log.debug("역할별 메뉴 조회: role={}", role);

        List<Menu> menus;

        if ("ADMIN".equals(role) || "STAFF".equals(role)) {
            // 관리자·스태프: 모든 메뉴 (일반 + 관리자 전용, STAFF는 LNB/ getAdminMenus에서 ERP 제외)
            menus = menuRepository.findAllActiveMenusOrdered();
        } else {
            // 일반 사용자: 관리자 전용 메뉴 제외
            menus = menuRepository.findNonAdminMenus();
        }

        return buildMenuTree(menus);
    }

    @Override
    public List<MenuDTO> getAdminMenus() {
        log.debug("관리자 전용 메뉴 조회");
        List<Menu> menus = menuRepository.findAdminOnlyMenus();
        return buildMenuTree(menus);
    }

    @Override
    public List<MenuDTO> getNonAdminMenus() {
        log.debug("일반 메뉴 조회");
        List<Menu> menus = menuRepository.findNonAdminMenus();
        return buildMenuTree(menus);
    }

    @Override
    public List<MenuDTO> getAllActiveMenus() {
        log.debug("전체 활성 메뉴 조회");
        List<Menu> menus = menuRepository.findAllActiveMenusOrdered();
        return buildMenuTree(menus);
    }

    @Override
    public MenuDTO getMenuByCode(String menuCode) {
        log.debug("메뉴 코드로 조회: menuCode={}", menuCode);
        Menu menu = menuRepository.findByMenuCode(menuCode)
            .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다: " + menuCode));
        return toDTO(menu);
    }

    @Override
    public MenuDTO getMenuByPath(String menuPath) {
        log.debug("메뉴 경로로 조회: menuPath={}", menuPath);
        Menu menu = menuRepository.findByMenuPath(menuPath)
            .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다: " + menuPath));
        return toDTO(menu);
    }

    @Override
    public List<MenuDTO> getLnbMenus(String role, Set<String> permissionCodes) {
        log.debug("LNB 메뉴 조회: role={}", role);
        if (role == null || role.isEmpty()) {
            return new ArrayList<>();
        }
        String location;
        Set<String> visibleRoles;
        switch (role.toUpperCase()) {
            case "ADMIN":
                location = "ADMIN_ONLY";
                visibleRoles = Set.of("ADMIN", "STAFF", "CONSULTANT", "CLIENT");
                break;
            case "STAFF":
                location = "ADMIN_ONLY";
                visibleRoles = Set.of("ADMIN", "STAFF", "CONSULTANT", "CLIENT");
                break;
            case "CONSULTANT":
                location = "CONSULTANT";
                visibleRoles = Set.of("CONSULTANT", "CLIENT");
                break;
            case "CLIENT":
                location = "CLIENT";
                visibleRoles = Set.of("CLIENT");
                break;
            default:
                return new ArrayList<>();
        }
        List<Menu> menus = menuRepository.findByMenuLocationAndRequiredRoleIn(location, visibleRoles);
        List<MenuDTO> tree = buildMenuTree(menus);
        if ("STAFF".equalsIgnoreCase(role) && (permissionCodes == null || !permissionCodes.contains("ERP_ACCESS"))) {
            tree = tree.stream()
                .filter(m -> !"ADM_ERP".equals(m.getMenuCode()))
                .collect(Collectors.toList());
        }
        return tree;
    }

    /**
     * 메뉴 트리 구조 생성
     */
    private List<MenuDTO> buildMenuTree(List<Menu> menus) {
        if (menus == null || menus.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. 모든 메뉴를 DTO로 변환하고 Map에 저장
        Map<Long, MenuDTO> menuMap = new HashMap<>();
        for (Menu menu : menus) {
            MenuDTO dto = toDTO(menu);
            menuMap.put(menu.getId(), dto);
        }

        // 2. 부모-자식 관계 설정
        List<MenuDTO> rootMenus = new ArrayList<>();
        for (Menu menu : menus) {
            MenuDTO dto = menuMap.get(menu.getId());

            if (menu.getParentMenuId() == null) {
                // 최상위 메뉴
                rootMenus.add(dto);
            } else {
                // 하위 메뉴
                MenuDTO parent = menuMap.get(menu.getParentMenuId());
                if (parent != null) {
                    parent.addChild(dto);
                } else {
                    // 부모가 없으면 최상위로 추가 (데이터 정합성 문제 방지)
                    log.warn("부모 메뉴를 찾을 수 없습니다: menuId={}, parentMenuId={}", 
                        menu.getId(), menu.getParentMenuId());
                    rootMenus.add(dto);
                }
            }
        }

        // 3. 정렬 순서대로 정렬
        sortMenuTree(rootMenus);

        return rootMenus;
    }

    /**
     * 메뉴 트리 정렬 (재귀)
     */
    private void sortMenuTree(List<MenuDTO> menus) {
        if (menus == null || menus.isEmpty()) {
            return;
        }

        // 현재 레벨 정렬
        menus.sort(Comparator.comparing(MenuDTO::getSortOrder));

        // 하위 메뉴 정렬 (재귀)
        for (MenuDTO menu : menus) {
            if (menu.hasChildren()) {
                sortMenuTree(menu.getChildren());
            }
        }
    }

    /**
     * Entity → DTO 변환
     */
    private MenuDTO toDTO(Menu menu) {
        return MenuDTO.builder()
            .id(menu.getId())
            .menuCode(menu.getMenuCode())
            .menuName(menu.getMenuName())
            .menuNameEn(menu.getMenuNameEn())
            .menuPath(menu.getMenuPath())
            .parentMenuId(menu.getParentMenuId())
            .depth(menu.getDepth())
            .requiredRole(menu.getRequiredRole())
            .isAdminOnly(menu.getIsAdminOnly())
            .icon(menu.getIcon())
            .description(menu.getDescription())
            .sortOrder(menu.getSortOrder())
            .isActive(menu.getIsActive())
            .children(new ArrayList<>())
            .build();
    }
}

