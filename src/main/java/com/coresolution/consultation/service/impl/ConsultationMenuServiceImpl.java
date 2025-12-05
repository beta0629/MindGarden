package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 메뉴 서비스 구현체
 * 공통 코드 기반 동적 메뉴 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultationMenuServiceImpl implements com.coresolution.consultation.service.MenuService {
    
    private final CommonCodeService commonCodeService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public Map<String, Object> getMenuStructureByRole(UserRole userRole) {
        log.info("🏗️ 사용자 역할별 메뉴 구조 생성: {}", userRole);
        
        try {
            // 공통 메뉴 조회
            List<Map<String, Object>> commonMenus = getCommonMenus();
            
            // 역할별 메뉴 조회
            List<Map<String, Object>> roleMenus = getMenusByRole(userRole);
            
            // 전체 메뉴 목록 합치기
            List<Map<String, Object>> allMenus = new ArrayList<>();
            allMenus.addAll(commonMenus);
            allMenus.addAll(roleMenus);
            
            // 메뉴 트리 구조 생성
            List<Map<String, Object>> menuTree = buildMenuTree(allMenus);
            
            // 동적 경로 적용
            applyDynamicPaths(menuTree, userRole);
            
            Map<String, Object> menuStructure = new HashMap<>();
            menuStructure.put("menus", menuTree);
            menuStructure.put("totalMenus", allMenus.size());
            menuStructure.put("userRole", userRole.name());
            menuStructure.put("roleDisplayName", userRole.getDisplayName());
            
            log.info("✅ 메뉴 구조 생성 완료 - 역할: {}, 총 메뉴: {}", userRole, allMenus.size());
            return menuStructure;
            
        } catch (Exception e) {
            log.error("❌ 메뉴 구조 생성 중 오류 발생: {}", e.getMessage(), e);
            return createEmptyMenuStructure(userRole);
        }
    }
    
    @Override
    public List<Map<String, Object>> getCommonMenus() {
        log.info("📋 공통 메뉴 조회");
        
        try {
            List<CommonCode> commonCodes = commonCodeService.getActiveCommonCodesByGroup("COMMON_MENU");
            
            return commonCodes.stream()
                    .map(this::convertToMenuMap)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("❌ 공통 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<Map<String, Object>> getMenusByRole(UserRole userRole) {
        log.info("📋 역할별 메뉴 조회: {}", userRole);
        
        try {
            List<String> menuGroups = getMenuGroupsByRole(userRole);
            
            if (menuGroups.isEmpty()) {
                log.warn("⚠️ 지원되지 않는 역할: {}", userRole);
                return new ArrayList<>();
            }
            
            List<Map<String, Object>> allMenus = new ArrayList<>();
            
            // 각 메뉴 그룹에서 메뉴 조회
            for (String menuGroup : menuGroups) {
                List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup(menuGroup);
                List<Map<String, Object>> groupMenus = roleCodes.stream()
                        .map(this::convertToMenuMap)
                        .collect(Collectors.toList());
                allMenus.addAll(groupMenus);
            }
            
            return allMenus;
                    
        } catch (Exception e) {
            log.error("❌ 역할별 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public boolean hasMenuPermission(UserRole userRole, String menuId) {
        log.info("🔒 메뉴 권한 확인: 역할={}, 메뉴={}", userRole, menuId);
        
        try {
            // 공통 메뉴는 모든 역할에서 접근 가능
            List<Map<String, Object>> commonMenus = getCommonMenus();
            boolean isCommonMenu = commonMenus.stream()
                    .anyMatch(menu -> menuId.equals(menu.get("id")));
            
            if (isCommonMenu) {
                log.info("✅ 공통 메뉴 접근 허용: {}", menuId);
                return true;
            }
            
            // 역할별 메뉴 권한 확인
            List<Map<String, Object>> roleMenus = getMenusByRole(userRole);
            boolean hasRolePermission = roleMenus.stream()
                    .anyMatch(menu -> menuId.equals(menu.get("id")));
            
            log.info("🔍 메뉴 권한 확인 결과: 역할={}, 메뉴={}, 권한={}", 
                    userRole, menuId, hasRolePermission);
            
            return hasRolePermission;
            
        } catch (Exception e) {
            log.error("❌ 메뉴 권한 확인 중 오류 발생: {}", e.getMessage(), e);
            return false; // 오류 시 권한 없음으로 처리
        }
    }
    
    @Override
    public String buildDynamicPath(String basePath, UserRole userRole) {
        if (basePath == null || basePath.isEmpty()) {
            return basePath;
        }
        
        // 동적 경로 패턴 처리
        if (basePath.contains("/dashboard") && !basePath.startsWith("/" + userRole.name().toLowerCase())) {
            return "/" + userRole.name().toLowerCase() + "/dashboard";
        }
        
        if (basePath.contains("/mypage") && !basePath.startsWith("/" + userRole.name().toLowerCase())) {
            return "/" + userRole.name().toLowerCase() + "/mypage";
        }
        
        return basePath;
    }
    
    @Override
    public List<Map<String, Object>> buildMenuTree(List<Map<String, Object>> menuList) {
        log.info("🌳 메뉴 트리 구조 생성 시작");
        
        // 메인 메뉴들 (hasSubMenu가 true이거나 type이 main인 것들)
        List<Map<String, Object>> mainMenus = menuList.stream()
                .filter(menu -> {
                    Map<String, Object> extraData = parseExtraData((String) menu.get("extraData"));
                    return "main".equals(extraData.get("type")) || 
                           Boolean.TRUE.equals(extraData.get("hasSubMenu"));
                })
                .collect(Collectors.toList());
        
        // 서브 메뉴들 (parent가 있는 것들)
        List<Map<String, Object>> subMenus = menuList.stream()
                .filter(menu -> {
                    Map<String, Object> extraData = parseExtraData((String) menu.get("extraData"));
                    return extraData.get("parent") != null;
                })
                .collect(Collectors.toList());
        
        // 메인 메뉴에 서브 메뉴들 연결
        for (Map<String, Object> mainMenu : mainMenus) {
            String mainMenuId = (String) mainMenu.get("codeValue");
            
            List<Map<String, Object>> childMenus = subMenus.stream()
                    .filter(subMenu -> {
                        Map<String, Object> extraData = parseExtraData((String) subMenu.get("extraData"));
                        return mainMenuId.equals(extraData.get("parent"));
                    })
                    .collect(Collectors.toList());
            
            mainMenu.put("subMenus", childMenus);
        }
        
        // 독립적인 메뉴들 (메인도 서브도 아닌 것들)
        List<Map<String, Object>> standaloneMenus = menuList.stream()
                .filter(menu -> {
                    Map<String, Object> extraData = parseExtraData((String) menu.get("extraData"));
                    return !"main".equals(extraData.get("type")) && 
                           !Boolean.TRUE.equals(extraData.get("hasSubMenu")) &&
                           extraData.get("parent") == null;
                })
                .collect(Collectors.toList());
        
        // 최종 트리 구조 생성
        List<Map<String, Object>> menuTree = new ArrayList<>();
        menuTree.addAll(standaloneMenus);
        menuTree.addAll(mainMenus);
        
        log.info("✅ 메뉴 트리 구조 생성 완료 - 메인 메뉴: {}, 독립 메뉴: {}", 
                mainMenus.size(), standaloneMenus.size());
        
        return menuTree;
    }
    
    /**
     * CommonCode를 메뉴 Map으로 변환
     */
    private Map<String, Object> convertToMenuMap(CommonCode code) {
        Map<String, Object> menu = new HashMap<>();
        menu.put("id", code.getCodeValue());
        menu.put("codeValue", code.getCodeValue());
        menu.put("label", code.getCodeLabel());
        menu.put("description", code.getCodeDescription());
        menu.put("sortOrder", code.getSortOrder());
        menu.put("extraData", code.getExtraData());
        
        // extraData에서 추가 정보 추출
        Map<String, Object> extraData = parseExtraData(code.getExtraData());
        if (extraData != null) {
            menu.put("icon", extraData.get("icon"));
            menu.put("path", extraData.get("path"));
            menu.put("type", extraData.get("type"));
            menu.put("parent", extraData.get("parent"));
            menu.put("hasSubMenu", extraData.get("hasSubMenu"));
        }
        
        return menu;
    }
    
    /**
     * 사용자 역할에 따른 메뉴 그룹명 반환
     */
    private List<String> getMenuGroupsByRole(UserRole userRole) {
        List<String> menuGroups = new ArrayList<>();
        
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
        if (userRole == null) {
            return menuGroups;
        }
        
        switch (userRole) {
            case ADMIN:
            case TENANT_ADMIN:
            case PRINCIPAL:
            case OWNER:
                // 표준 관리자 역할
                menuGroups.add("ADMIN_MENU");
                break;
            case CONSULTANT:
                menuGroups.add("CONSULTANT_MENU");
                break;
            case CLIENT:
                menuGroups.add("CLIENT_MENU");
                break;
            case STAFF:
                menuGroups.add("STAFF_MENU");
                break;
            case PARENT:
                menuGroups.add("PARENT_MENU");
                break;
            default:
                log.warn("⚠️ 지원되지 않는 역할: {}", userRole);
                break;
        }
        
        return menuGroups;
    }
    
    /**
     * extraData JSON 문자열을 Map으로 파싱
     */
    private Map<String, Object> parseExtraData(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.trim().isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            return objectMapper.readValue(extraDataJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("⚠️ extraData 파싱 실패: {}", extraDataJson);
            return new HashMap<>();
        }
    }
    
    /**
     * 메뉴에 동적 경로 적용
     */
    private void applyDynamicPaths(List<Map<String, Object>> menuTree, UserRole userRole) {
        for (Map<String, Object> menu : menuTree) {
            String path = (String) menu.get("path");
            if (path != null) {
                menu.put("path", buildDynamicPath(path, userRole));
            }
            
            // 서브 메뉴에도 동적 경로 적용
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> subMenus = (List<Map<String, Object>>) menu.get("subMenus");
            if (subMenus != null) {
                applyDynamicPaths(subMenus, userRole);
            }
        }
    }
    
    /**
     * 빈 메뉴 구조 생성 (오류 시 사용)
     */
    private Map<String, Object> createEmptyMenuStructure(UserRole userRole) {
        Map<String, Object> emptyStructure = new HashMap<>();
        emptyStructure.put("menus", new ArrayList<>());
        emptyStructure.put("totalMenus", 0);
        emptyStructure.put("userRole", userRole.name());
        emptyStructure.put("roleDisplayName", userRole.getDisplayName());
        return emptyStructure;
    }
}
