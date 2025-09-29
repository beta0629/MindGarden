package com.mindgarden.consultation.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.Permission;
import com.mindgarden.consultation.entity.RolePermission;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.PermissionRepository;
import com.mindgarden.consultation.repository.RolePermissionRepository;
import com.mindgarden.consultation.service.DynamicPermissionService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 동적 권한 관리 서비스 구현체
 * 데이터베이스 기반으로 권한을 동적으로 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DynamicPermissionServiceImpl implements DynamicPermissionService {
    
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    
    @Override
    public boolean hasPermission(User user, String permissionCode) {
        if (user == null || user.getRole() == null || permissionCode == null) {
            log.warn("권한 체크 실패: 사용자 또는 권한 코드가 null입니다.");
            return false;
        }
        
        return hasPermission(user.getRole().name(), permissionCode);
    }
    
    @Override
    @Cacheable(value = "userPermissions", key = "#roleName + '_' + #permissionCode")
    public boolean hasPermission(String roleName, String permissionCode) {
        try {
            log.debug("권한 체크: 역할={}, 권한={}", roleName, permissionCode);
            
            boolean hasPermission = rolePermissionRepository
                .existsByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode);
            
            log.debug("권한 체크 결과: 역할={}, 권한={}, 결과={}", roleName, permissionCode, hasPermission);
            return hasPermission;
            
        } catch (Exception e) {
            log.error("권한 체크 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }
    
    @Override
    @Cacheable(value = "userPermissionsList", key = "#user.role.name()")
    public List<Map<String, Object>> getUserPermissions(User user) {
        if (user == null || user.getRole() == null) {
            return new ArrayList<>();
        }
        
        return getRolePermissions(user.getRole().name());
    }
    
    @Override
    @Cacheable(value = "rolePermissions", key = "#roleName")
    public List<Map<String, Object>> getRolePermissions(String roleName) {
        try {
            log.debug("역할 권한 조회: 역할={}", roleName);
            
            List<RolePermission> rolePermissions = rolePermissionRepository
                .findByRoleNameAndIsActiveTrue(roleName);
            
            List<Map<String, Object>> permissions = rolePermissions.stream()
                .map(this::convertToPermissionMap)
                .collect(Collectors.toList());
            
            log.debug("역할 권한 조회 완료: 역할={}, 권한 수={}", roleName, permissions.size());
            return permissions;
            
        } catch (Exception e) {
            log.error("역할 권한 조회 중 오류 발생: 역할={}", roleName, e);
            return new ArrayList<>();
        }
    }
    
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"}, allEntries = true)
    public boolean grantPermission(String roleName, String permissionCode, String grantedBy) {
        try {
            log.info("권한 부여: 역할={}, 권한={}, 부여자={}", roleName, permissionCode, grantedBy);
            
            // 권한 존재 여부 확인
            if (!permissionExists(permissionCode)) {
                log.warn("존재하지 않는 권한: {}", permissionCode);
                return false;
            }
            
            // 이미 권한이 있는지 확인
            if (rolePermissionRepository.existsByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)) {
                log.info("이미 권한이 부여됨: 역할={}, 권한={}", roleName, permissionCode);
                return true;
            }
            
            // 권한 부여
            RolePermission rolePermission = RolePermission.grant(roleName, permissionCode, grantedBy);
            rolePermissionRepository.save(rolePermission);
            
            log.info("권한 부여 성공: 역할={}, 권한={}", roleName, permissionCode);
            return true;
            
        } catch (Exception e) {
            log.error("권한 부여 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }
    
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"}, allEntries = true)
    public boolean revokePermission(String roleName, String permissionCode) {
        try {
            log.info("권한 회수: 역할={}, 권한={}", roleName, permissionCode);
            
            // 권한 매핑 조회
            RolePermission rolePermission = rolePermissionRepository
                .findByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)
                .orElse(null);
            
            if (rolePermission == null) {
                log.info("권한이 존재하지 않음: 역할={}, 권한={}", roleName, permissionCode);
                return true; // 이미 없으므로 성공으로 처리
            }
            
            // 권한 비활성화
            rolePermission.setIsActive(false);
            rolePermissionRepository.save(rolePermission);
            
            log.info("권한 회수 성공: 역할={}, 권한={}", roleName, permissionCode);
            return true;
            
        } catch (Exception e) {
            log.error("권한 회수 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }
    
    @Override
    @Cacheable(value = "permissionExists", key = "#permissionCode")
    public boolean permissionExists(String permissionCode) {
        try {
            log.debug("권한 존재 확인: 권한={}", permissionCode);
            
            boolean exists = permissionRepository.existsByPermissionCode(permissionCode);
            
            log.debug("권한 존재 확인 결과: 권한={}, 존재={}", permissionCode, exists);
            return exists;
            
        } catch (Exception e) {
            log.error("권한 존재 확인 중 오류 발생: 권한={}", permissionCode, e);
            return false;
        }
    }
    
    @Override
    @Cacheable(value = "allPermissions")
    public List<Map<String, Object>> getAllPermissions() {
        try {
            log.debug("모든 권한 조회");
            
            List<Permission> permissions = permissionRepository.findByIsActiveTrue();
            
            List<Map<String, Object>> permissionMaps = permissions.stream()
                .map(this::convertPermissionToMap)
                .collect(Collectors.toList());
            
            log.debug("모든 권한 조회 완료: 권한 수={}", permissionMaps.size());
            return permissionMaps;
            
        } catch (Exception e) {
            log.error("모든 권한 조회 중 오류 발생", e);
            return new ArrayList<>();
        }
    }
    
    @Override
    @Cacheable(value = "permissionsByCategory", key = "#category")
    public List<Map<String, Object>> getPermissionsByCategory(String category) {
        try {
            log.debug("카테고리별 권한 조회: 카테고리={}", category);
            
            List<Permission> permissions = permissionRepository.findByCategoryAndIsActiveTrue(category);
            
            List<Map<String, Object>> permissionMaps = permissions.stream()
                .map(this::convertPermissionToMap)
                .collect(Collectors.toList());
            
            log.debug("카테고리별 권한 조회 완료: 카테고리={}, 권한 수={}", category, permissionMaps.size());
            return permissionMaps;
            
        } catch (Exception e) {
            log.error("카테고리별 권한 조회 중 오류 발생: 카테고리={}", category, e);
            return new ArrayList<>();
        }
    }
    
    @Override
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions", "permissionExists", "allPermissions", "permissionsByCategory"}, allEntries = true)
    public void clearPermissionCache() {
        log.info("권한 캐시 초기화");
    }
    
    @Override
    public void refreshPermissionCache() {
        log.info("권한 캐시 새로고침");
        clearPermissionCache();
        
        // 주요 권한들을 미리 캐시에 로드
        List<String> commonRoles = List.of("ADMIN", "BRANCH_SUPER_ADMIN", "HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER");
        List<String> commonPermissions = List.of(
            "ACCESS_ERP_DASHBOARD", 
            "ACCESS_INTEGRATED_FINANCE", 
            "ACCESS_ADMIN_DASHBOARD",
            "MANAGE_USERS",
            "VIEW_ALL_BRANCHES"
        );
        
        for (String role : commonRoles) {
            for (String permission : commonPermissions) {
                hasPermission(role, permission);
            }
        }
        
        log.info("권한 캐시 새로고침 완료");
    }
    
    /**
     * 권한 체크 헬퍼 메서드들
     */
    
    /**
     * ERP 대시보드 접근 권한 확인
     */
    public boolean canAccessErpDashboard(User user) {
        return hasPermission(user, "ACCESS_ERP_DASHBOARD");
    }
    
    /**
     * 통합 회계 시스템 접근 권한 확인
     */
    public boolean canAccessIntegratedFinance(User user) {
        return hasPermission(user, "ACCESS_INTEGRATED_FINANCE");
    }
    
    /**
     * 관리자 대시보드 접근 권한 확인
     */
    public boolean canAccessAdminDashboard(User user) {
        return hasPermission(user, "ACCESS_ADMIN_DASHBOARD");
    }
    
    /**
     * 모든 지점 조회 권한 확인
     */
    public boolean canViewAllBranches(User user) {
        return hasPermission(user, "VIEW_ALL_BRANCHES");
    }
    
    /**
     * 사용자 관리 권한 확인
     */
    public boolean canManageUsers(User user) {
        return hasPermission(user, "MANAGE_USERS");
    }
    
    /**
     * 권한 관리 권한 확인
     */
    public boolean canManagePermissions(User user) {
        return hasPermission(user, "PERMISSION_MANAGEMENT");
    }
    
    // ==================== 헬퍼 메서드 ====================
    
    /**
     * RolePermission을 Map으로 변환
     */
    private Map<String, Object> convertToPermissionMap(RolePermission rolePermission) {
        Map<String, Object> map = new HashMap<>();
        map.put("permission_code", rolePermission.getPermissionCode());
        map.put("role_name", rolePermission.getRoleName());
        map.put("granted_by", rolePermission.getGrantedBy());
        map.put("granted_at", rolePermission.getGrantedAt());
        map.put("is_active", rolePermission.getIsActive());
        
        // 권한 상세 정보 조회
        Permission permission = permissionRepository.findByPermissionCode(rolePermission.getPermissionCode()).orElse(null);
        if (permission != null) {
            map.put("permission_name", permission.getPermissionName());
            map.put("permission_description", permission.getPermissionDescription());
            map.put("category", permission.getCategory());
        }
        
        return map;
    }
    
    /**
     * Permission을 Map으로 변환
     */
    private Map<String, Object> convertPermissionToMap(Permission permission) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", permission.getId());
        map.put("permission_code", permission.getPermissionCode());
        map.put("permission_name", permission.getPermissionName());
        map.put("permission_description", permission.getPermissionDescription());
        map.put("category", permission.getCategory());
        map.put("is_active", permission.getIsActive());
        map.put("created_at", permission.getCreatedAt());
        map.put("updated_at", permission.getUpdatedAt());
        return map;
    }
    
    // ==================== 추가 권한 체크 메서드들 ====================
    
    @Override
    public boolean canRegisterScheduler(UserRole userRole) {
        try {
            log.debug("스케줄러 등록 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "ACCESS_SCHEDULE_MANAGEMENT");
        } catch (Exception e) {
            log.error("스케줄러 등록 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }
    
    @Override
    public boolean canViewBranchDetails(UserRole userRole) {
        try {
            log.debug("지점 상세 조회 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "VIEW_BRANCH_DETAILS");
        } catch (Exception e) {
            log.error("지점 상세 조회 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }
    
    @Override
    public boolean canAccessPayment(UserRole userRole) {
        try {
            log.debug("결제 기능 접근 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "ACCESS_PAYMENT");
        } catch (Exception e) {
            log.error("결제 기능 접근 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }
    
    @Override
    public List<UserRole> getRolesWithPermission(String permissionCode) {
        try {
            log.debug("권한별 역할 조회: 권한={}", permissionCode);
            
            List<String> roleNames = rolePermissionRepository
                .findRoleNamesByPermissionCodeAndIsActiveTrue(permissionCode);
            
            List<UserRole> roles = roleNames.stream()
                .map(roleName -> {
                    try {
                        return UserRole.valueOf(roleName);
                    } catch (IllegalArgumentException e) {
                        log.warn("유효하지 않은 역할명: {}", roleName);
                        return null;
                    }
                })
                .filter(role -> role != null)
                .collect(Collectors.toList());
            
            log.debug("권한별 역할 조회 완료: 권한={}, 역할 수={}", permissionCode, roles.size());
            return roles;
            
        } catch (Exception e) {
            log.error("권한별 역할 조회 실패: 권한={}", permissionCode, e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<String> getRolePermissions(UserRole userRole) {
        try {
            log.debug("역할별 권한 목록 조회: 역할={}", userRole);
            
            List<RolePermission> rolePermissions = rolePermissionRepository
                .findByRoleNameAndIsActiveTrue(userRole.name());
            
            List<String> permissions = rolePermissions.stream()
                .map(RolePermission::getPermissionCode)
                .collect(Collectors.toList());
            
            log.debug("역할별 권한 목록 조회 완료: 역할={}, 권한 수={}", userRole, permissions.size());
            return permissions;
            
        } catch (Exception e) {
            log.error("역할별 권한 목록 조회 실패: 역할={}", userRole, e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public List<String> getUserPermissionsAsStringList(User user) {
        try {
            log.debug("사용자 권한 목록 조회 (String 리스트): 사용자={}", user.getUsername());
            
            List<Map<String, Object>> permissionMaps = getUserPermissions(user);
            
            List<String> permissions = permissionMaps.stream()
                .map(map -> (String) map.get("permission_code"))
                .filter(permissionCode -> permissionCode != null)
                .collect(Collectors.toList());
            
            log.debug("사용자 권한 목록 조회 완료 (String 리스트): 사용자={}, 권한 수={}", user.getUsername(), permissions.size());
            return permissions;
            
        } catch (Exception e) {
            log.error("사용자 권한 목록 조회 실패 (String 리스트): 사용자={}", user.getUsername(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public boolean hasPermission(UserRole userRole, String permissionCode) {
        try {
            log.debug("역할별 권한 체크: 역할={}, 권한={}", userRole, permissionCode);
            return hasPermission(userRole.name(), permissionCode);
        } catch (Exception e) {
            log.error("역할별 권한 체크 실패: 역할={}, 권한={}", userRole, permissionCode, e);
            return false;
        }
    }
}