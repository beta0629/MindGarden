package com.coresolution.consultation.service.impl;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.BranchPermissionService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 /**
 * 지점별 권한 관리 서비스 구현체
 /**
 * 기존 동적 권한 시스템을 지점별로 확장
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
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
            log.warn("사용자 지점코드 없음: {}", user.getUserId());
            return false;
        }
        
        // TODO: 실제 지점 ID와 지점코드 매핑 확인
        // 현재는 지점코드 기반으로만 확인
        boolean canAccess = true; // 임시로 true 반환
        
        log.debug("지점 데이터 접근 권한 확인: 사용자={}, 사용자지점코드={}, 대상지점={}, 접근가능={}", 
                user.getUserId(), userBranchCode, targetBranchId, canAccess);
        
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
    
    // 인터페이스에 없는 메서드 (레거시 호환용)
    public Map<String, List<String>> getRolePermissions(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("tenantId가 없어서 권한 조회 불가");
            return new HashMap<>();
        }
        
        try {
            // 공통코드에서 역할별 권한 조회
            List<CommonCode> rolePermissions = commonCodeService.getActiveCommonCodesByGroup(ROLE_PERMISSION_GROUP);
            
            Map<String, List<String>> result = new HashMap<>();
            
            for (CommonCode permission : rolePermissions) {
                String permissionCode = permission.getCodeValue();
                String roleName = permission.getCodeLabel(); // 예: "ADMIN", "CONSULTANT"
                
                // extraData에서 권한 목록 파싱
                String extraData = permission.getExtraData();
                if (extraData != null && !extraData.trim().isEmpty()) {
                    // JSON 파싱 로직 (간단한 예시)
                    // 실제로는 JSON 파서 사용 권장
                    List<String> permissions = parsePermissionsFromExtraData(extraData);
                    result.put(roleName, permissions);
                }
            }
            
            return result;
        } catch (Exception e) {
            log.error("역할별 권한 조회 실패: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }
    
    // 인터페이스에 없는 메서드 (레거시 호환용)
    public Map<String, List<String>> getBranchPermissions(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("tenantId가 없어서 권한 조회 불가");
            return new HashMap<>();
        }
        
        try {
            // 공통코드에서 지점별 권한 조회
            List<CommonCode> branchPermissions = commonCodeService.getActiveCommonCodesByGroup(BRANCH_PERMISSION_GROUP);
            
            Map<String, List<String>> rolePermissions = new HashMap<>();
            
            for (CommonCode permission : branchPermissions) {
                String permissionCode = permission.getCodeValue();
                String roleName = permission.getCodeLabel();
                
                // extraData에서 권한 목록 파싱
                String extraData = permission.getExtraData();
                if (extraData != null && !extraData.trim().isEmpty()) {
                    List<String> permissions = parsePermissionsFromExtraData(extraData);
                    rolePermissions.put(roleName, permissions);
                }
            }
            
            return rolePermissions;
        } catch (Exception e) {
            log.error("지점별 권한 조회 실패: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }
    
    // 인터페이스에 없는 메서드 (레거시 호환용)
    public List<Map<String, Object>> getMenuPermissions(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("tenantId가 없어서 메뉴 권한 조회 불가");
            return new ArrayList<>();
        }
        
        try {
            // 공통코드에서 메뉴 권한 조회
            List<CommonCode> menus = commonCodeService.getActiveCommonCodesByGroup(MENU_GROUP);
            
            List<Map<String, Object>> menuList = new ArrayList<>();
            
            for (CommonCode menu : menus) {
                Map<String, Object> menuInfo = new HashMap<>();
                menuInfo.put("code", menu.getCodeValue());
                menuInfo.put("label", menu.getCodeLabel());
                menuInfo.put("description", menu.getCodeDescription());
                menuInfo.put("icon", menu.getIcon());
                menuInfo.put("sortOrder", menu.getSortOrder());
                
                // extraData에서 추가 정보 파싱
                String extraData = menu.getExtraData();
                if (extraData != null && !extraData.trim().isEmpty()) {
                    // JSON 파싱 로직
                    menuInfo.put("extraData", extraData);
                }
                
                menuList.add(menuInfo);
            }
            
            return menuList;
        } catch (Exception e) {
            log.error("메뉴 권한 조회 실패: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public boolean canManageBranchConsultants(User user, Long branchId) {
        return canManageBranch(user, branchId);
    }
    
    @Override
    public boolean canManageBranchClients(User user, Long branchId) {
        return canManageBranch(user, branchId);
    }
    
    @Override
    public boolean canManageBranchSchedules(User user, Long branchId) {
        return canManageBranch(user, branchId);
    }
    
    @Override
    public boolean canViewBranchStatistics(User user, Long branchId) {
        return canAccessBranchData(user, branchId);
    }
    
    @Override
    public List<String> getBranchPermissions(User user, Long branchId) {
        if (user == null || branchId == null) {
            return new ArrayList<>();
        }
        
        List<String> permissions = new ArrayList<>();
        
        if (canManageBranch(user, branchId)) {
            permissions.add("MANAGE_BRANCH");
        }
        if (canManageBranchConsultants(user, branchId)) {
            permissions.add("MANAGE_CONSULTANTS");
        }
        if (canManageBranchClients(user, branchId)) {
            permissions.add("MANAGE_CLIENTS");
        }
        if (canManageBranchSchedules(user, branchId)) {
            permissions.add("MANAGE_SCHEDULES");
        }
        if (canViewBranchStatistics(user, branchId)) {
            permissions.add("VIEW_STATISTICS");
        }
        
        return permissions;
    }
    
    @Override
    public Map<String, Object> getBranchPermissionMatrix(Long branchId) {
        Map<String, Object> matrix = new HashMap<>();
        matrix.put("branchId", branchId);
        matrix.put("permissions", new HashMap<>());
        return matrix;
    }
    
    @Override
    public List<Map<String, Object>> getBranchMenuPermissions(User user, Long branchId) {
        if (user == null || branchId == null) {
            return new ArrayList<>();
        }
        
        String tenantId = user.getTenantId();
        if (tenantId == null) {
            return new ArrayList<>();
        }
        
        return getMenuPermissions(tenantId);
    }
    
    /**
     * 본사 관리자인지 확인
     */
    private boolean isHeadquartersAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        UserRole role = user.getRole();
        return isAdminRoleFromCommonCode(role);
    }
    
    /**
     * 지점 관리자인지 확인
     */
    private boolean isBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        UserRole role = user.getRole();
        return isAdminRoleFromCommonCode(role) || isStaffRoleFromCommonCode(role);
    }
    
    /**
     * 지점 관련 권한인지 확인
     */
    private boolean isBranchRelatedPermission(String permission) {
        if (permission == null || permission.trim().isEmpty()) {
            return false;
        }
        
        // 지점 관련 권한 코드 목록
        List<String> branchPermissions = List.of(
            "BRANCH_VIEW",
            "BRANCH_MANAGE",
            "BRANCH_DATA_ACCESS",
            "BRANCH_STATISTICS"
        );
        
        return branchPermissions.contains(permission.toUpperCase());
    }
    
    /**
     * extraData에서 권한 목록 파싱
     */
    private List<String> parsePermissionsFromExtraData(String extraData) {
        List<String> permissions = new ArrayList<>();
        
        try {
            // 간단한 JSON 파싱 (실제로는 JSON 라이브러리 사용 권장)
            if (extraData.contains("\"permissions\"")) {
                // JSON 파싱 로직
                // 예: {"permissions": ["PERMISSION1", "PERMISSION2"]}
                String permissionsStr = extraData.substring(
                    extraData.indexOf("[") + 1,
                    extraData.indexOf("]")
                );
                
                String[] permissionArray = permissionsStr.split(",");
                for (String permission : permissionArray) {
                    String cleaned = permission.trim()
                        .replace("\"", "")
                        .replace("'", "");
                    if (!cleaned.isEmpty()) {
                        permissions.add(cleaned);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("권한 파싱 실패: {}", extraData, e);
        }
        
        return permissions;
    }
    
    /**
     * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
     * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음
     * 
     * @param role 사용자 역할
     * @return 관리자 역할 여부
     */
    private boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
                return role == UserRole.ADMIN || 
                       role == UserRole.TENANT_ADMIN || 
                       role == UserRole.PRINCIPAL || 
                       role == UserRole.OWNER;
            }
            // 공통코드에서 관리자 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isAdmin\":true") || 
                                code.getExtraData().contains("\"roleType\":\"ADMIN\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            // 폴백: 표준 관리자 역할만 체크
            return role == UserRole.ADMIN || 
                   role == UserRole.TENANT_ADMIN || 
                   role == UserRole.PRINCIPAL || 
                   role == UserRole.OWNER;
        }
    }
    
    /**
     * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * BRANCH_MANAGER → STAFF로 통합
     * 
     * @param role 사용자 역할
     * @return 사무원 역할 여부
     */
    private boolean isStaffRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 사무원 역할 목록 조회
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.STAFF;
            }
            // 공통코드에서 사무원 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isStaff\":true") || 
                                code.getExtraData().contains("\"roleType\":\"STAFF\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.STAFF;
        }
    }
}
