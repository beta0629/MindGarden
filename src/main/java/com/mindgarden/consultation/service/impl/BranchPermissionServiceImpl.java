package com.mindgarden.consultation.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.BranchPermissionService;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점별 권한 관리 서비스 구현체
 * 기존 동적 권한 시스템을 지점별로 확장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchPermissionServiceImpl implements BranchPermissionService {
    
    private final DynamicPermissionService dynamicPermissionService;
    private final CommonCodeService commonCodeService;
    
    // 지점별 권한 관련 공통코드 그룹
    private static final String BRANCH_PERMISSION_GROUP = "BRANCH_PERMISSION";
    private static final String ROLE_PERMISSION_GROUP = "ROLE_PERMISSION";
    private static final String MENU_GROUP = "MENU";
    
    @Override
    public boolean canAccessBranchData(User user, Long targetBranchId) {
        if (user == null || targetBranchId == null) {
            return false;
        }
        
        // 본사 관리자는 모든 지점 데이터 접근 가능
        if (isHeadquartersAdmin(user)) {
            log.debug("본사 관리자 - 모든 지점 데이터 접근 허용");
            return true;
        }
        
        // 사용자의 지점코드 확인
        String userBranchCode = user.getBranchCode();
        if (userBranchCode == null || userBranchCode.trim().isEmpty()) {
            log.warn("사용자 지점코드 없음: {}", user.getUsername());
            return false;
        }
        
        // TODO: 실제 지점 ID와 지점코드 매핑 확인
        // 현재는 지점코드 기반으로만 확인
        boolean canAccess = true; // 임시로 true 반환
        
        log.debug("지점 데이터 접근 권한 확인: 사용자={}, 사용자지점코드={}, 대상지점={}, 접근가능={}", 
                user.getUsername(), userBranchCode, targetBranchId, canAccess);
        
        return canAccess;
    }
    
    @Override
    public boolean canManageBranches(User user) {
        if (user == null) {
            return false;
        }
        
        // 기존 동적 권한 시스템 활용
        return dynamicPermissionService.hasPermission(user, "MANAGE_BRANCHES");
    }
    
    @Override
    public boolean canManageBranch(User user, Long branchId) {
        if (user == null || branchId == null) {
            return false;
        }
        
        // 본사 관리자는 모든 지점 관리 가능
        if (isHeadquartersAdmin(user)) {
            return true;
        }
        
        // 지점 관리자는 자신의 지점만 관리 가능
        if (isBranchAdmin(user)) {
            return canAccessBranchData(user, branchId);
        }
        
        return false;
    }
    
    @Override
    public boolean canManageBranchConsultants(User user, Long branchId) {
        if (user == null || branchId == null) {
            return false;
        }
        
        // 지점 관리 권한이 있어야 상담사 관리 가능
        if (!canManageBranch(user, branchId)) {
            return false;
        }
        
        // 기존 동적 권한 시스템 활용
        return dynamicPermissionService.hasPermission(user, "MANAGE_CONSULTANTS");
    }
    
    @Override
    public boolean canManageBranchClients(User user, Long branchId) {
        if (user == null || branchId == null) {
            return false;
        }
        
        // 지점 관리 권한이 있어야 내담자 관리 가능
        if (!canManageBranch(user, branchId)) {
            return false;
        }
        
        // 기존 동적 권한 시스템 활용
        return dynamicPermissionService.hasPermission(user, "MANAGE_CLIENTS");
    }
    
    @Override
    public boolean canManageBranchSchedules(User user, Long branchId) {
        if (user == null || branchId == null) {
            return false;
        }
        
        // 지점 관리 권한이 있어야 스케줄 관리 가능
        if (!canManageBranch(user, branchId)) {
            return false;
        }
        
        // 기존 동적 권한 시스템 활용
        return dynamicPermissionService.hasPermission(user, "MANAGE_SCHEDULES");
    }
    
    @Override
    public boolean canViewBranchStatistics(User user, Long branchId) {
        if (user == null || branchId == null) {
            return false;
        }
        
        // 지점 데이터 접근 권한이 있어야 통계 조회 가능
        if (!canAccessBranchData(user, branchId)) {
            return false;
        }
        
        // 기존 동적 권한 시스템 활용
        return dynamicPermissionService.hasPermission(user, "VIEW_STATISTICS");
    }
    
    @Override
    public List<String> getBranchPermissions(User user, Long branchId) {
        List<String> permissions = new ArrayList<>();
        
        if (user == null || branchId == null) {
            return permissions;
        }
        
        // 기존 동적 권한 시스템에서 권한 목록 조회
        List<CommonCode> rolePermissions = commonCodeService.getActiveCommonCodesByGroup(ROLE_PERMISSION_GROUP);
        
        for (CommonCode permission : rolePermissions) {
            String permissionCode = permission.getCodeValue();
            if (permissionCode.startsWith(user.getRole().name() + "-")) {
                String actualPermission = permissionCode.substring(user.getRole().name().length() + 1);
                
                // 지점별 권한 확인
                if (isBranchRelatedPermission(actualPermission)) {
                    if (checkBranchPermission(user, branchId, actualPermission)) {
                        permissions.add(actualPermission);
                    }
                }
            }
        }
        
        log.debug("지점별 권한 목록 조회: 사용자={}, 지점={}, 권한수={}", 
                user.getUsername(), branchId, permissions.size());
        
        return permissions;
    }
    
    @Override
    public Map<String, Object> getBranchPermissionMatrix(Long branchId) {
        Map<String, Object> matrix = new HashMap<>();
        
        // 모든 역할별 지점 권한 매트릭스 조회
        List<CommonCode> branchPermissions = commonCodeService.getActiveCommonCodesByGroup(BRANCH_PERMISSION_GROUP);
        
        Map<String, List<String>> rolePermissions = new HashMap<>();
        
        for (CommonCode permission : branchPermissions) {
            String codeValue = permission.getCodeValue();
            if (codeValue.contains("-")) {
                String[] parts = codeValue.split("-", 2);
                String role = parts[0];
                String permissionName = parts[1];
                
                rolePermissions.computeIfAbsent(role, k -> new ArrayList<>()).add(permissionName);
            }
        }
        
        matrix.put("branchId", branchId);
        matrix.put("rolePermissions", rolePermissions);
        matrix.put("totalRoles", rolePermissions.size());
        
        log.debug("지점별 권한 매트릭스 조회 완료: 지점={}", branchId);
        
        return matrix;
    }
    
    @Override
    public List<Map<String, Object>> getBranchMenuPermissions(User user, Long branchId) {
        List<Map<String, Object>> menuPermissions = new ArrayList<>();
        
        if (user == null || branchId == null) {
            return menuPermissions;
        }
        
        // 기존 동적 메뉴 시스템 활용
        List<CommonCode> menus = commonCodeService.getActiveCommonCodesByGroup(MENU_GROUP);
        
        for (CommonCode menu : menus) {
            Map<String, Object> menuInfo = new HashMap<>();
            menuInfo.put("menuId", menu.getId());
            menuInfo.put("menuCode", menu.getCodeValue());
            menuInfo.put("menuName", menu.getCodeLabel());
            menuInfo.put("menuDescription", menu.getCodeDescription());
            
            // 지점별 메뉴 접근 권한 확인
            boolean hasAccess = checkBranchMenuAccess(user, branchId, menu.getCodeValue());
            menuInfo.put("hasAccess", hasAccess);
            
            menuPermissions.add(menuInfo);
        }
        
        log.debug("지점별 메뉴 권한 조회 완료: 사용자={}, 지점={}, 메뉴수={}", 
                user.getUsername(), branchId, menuPermissions.size());
        
        return menuPermissions;
    }
    
    /**
     * 본사 관리자인지 확인
     */
    private boolean isHeadquartersAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        UserRole role = user.getRole();
        return role.isHeadquartersAdmin() || role.isMaster();
    }
    
    /**
     * 지점 관리자인지 확인
     */
    private boolean isBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        UserRole role = user.getRole();
        return role.isBranchAdmin() || role.isBranchManager();
    }
    
    /**
     * 지점 관련 권한인지 확인
     */
    private boolean isBranchRelatedPermission(String permission) {
        return permission.startsWith("BRANCH_") || 
               permission.startsWith("MANAGE_") || 
               permission.startsWith("VIEW_");
    }
    
    /**
     * 지점별 권한 확인
     */
    private boolean checkBranchPermission(User user, Long branchId, String permission) {
        // 기본 권한 확인
        if (!dynamicPermissionService.hasPermission(user, permission)) {
            return false;
        }
        
        // 지점별 접근 권한 확인
        return canAccessBranchData(user, branchId);
    }
    
    /**
     * 지점별 메뉴 접근 권한 확인
     */
    private boolean checkBranchMenuAccess(User user, Long branchId, String menuCode) {
        // 기본 메뉴 접근 권한 확인
        if (!dynamicPermissionService.hasPermission(user, "ACCESS_" + menuCode)) {
            return false;
        }
        
        // 지점별 접근 권한 확인
        return canAccessBranchData(user, branchId);
    }
}
