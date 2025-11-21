package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;

/**
 * 동적 권한 관리 서비스
 * 데이터베이스 기반으로 권한을 동적으로 관리
 */
public interface DynamicPermissionService {
    
    /**
     * 사용자가 특정 권한을 가지고 있는지 확인
     * @param user 사용자 객체
     * @param permissionCode 권한 코드
     * @return 권한 보유 여부
     */
    boolean hasPermission(User user, String permissionCode);
    
    /**
     * 사용자가 특정 권한을 가지고 있는지 확인 (역할명으로)
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @return 권한 보유 여부
     */
    boolean hasPermission(String roleName, String permissionCode);
    
    /**
     * 사용자의 모든 권한 목록 조회
     * @param user 사용자 객체
     * @return 권한 목록
     */
    List<Map<String, Object>> getUserPermissions(User user);
    
    /**
     * 역할의 모든 권한 목록 조회
     * @param roleName 역할명
     * @return 권한 목록
     */
    List<Map<String, Object>> getRolePermissions(String roleName);
    
    /**
     * 사용자에게 권한 부여
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @param grantedBy 부여자
     * @return 성공 여부
     */
    boolean grantPermission(String roleName, String permissionCode, String grantedBy);
    
    /**
     * 사용자 권한 회수
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @return 성공 여부
     */
    boolean revokePermission(String roleName, String permissionCode);
    
    /**
     * 권한 존재 여부 확인
     * @param permissionCode 권한 코드
     * @return 권한 존재 여부
     */
    boolean permissionExists(String permissionCode);
    
    /**
     * 모든 권한 목록 조회
     * @return 권한 목록
     */
    List<Map<String, Object>> getAllPermissions();
    
    /**
     * 카테고리별 권한 목록 조회
     * @param category 카테고리
     * @return 권한 목록
     */
    List<Map<String, Object>> getPermissionsByCategory(String category);
    
    /**
     * 권한 캐시 초기화
     */
    void clearPermissionCache();
    
    /**
     * 권한 캐시 새로고침
     */
    void refreshPermissionCache();
    
    // ==================== 추가 권한 체크 메서드들 ====================
    
    /**
     * 스케줄러 등록 권한 확인
     */
    boolean canRegisterScheduler(UserRole userRole);
    
    /**
     * 지점 상세 조회 권한 확인
     */
    boolean canViewBranchDetails(UserRole userRole);
    
    /**
     * 결제 기능 접근 권한 확인
     */
    boolean canAccessPayment(UserRole userRole);
    
    /**
     * 특정 권한을 가진 역할 목록 조회
     */
    List<UserRole> getRolesWithPermission(String permissionCode);
    
    /**
     * 역할별 권한 목록 조회 (UserRole enum 사용)
     */
    List<String> getRolePermissions(UserRole userRole);
    
    /**
     * 사용자 권한 목록 조회 (String 리스트 반환)
     */
    List<String> getUserPermissionsAsStringList(User user);
    
    /**
     * 역할별 권한 체크 (UserRole enum 사용)
     */
    boolean hasPermission(UserRole userRole, String permissionCode);
    
    /**
     * 역할별 권한 설정 (기존 권한을 모두 제거하고 새로 설정)
     * @param roleName 역할명
     * @param permissionCodes 권한 코드 목록
     * @return 성공 여부
     */
    boolean setRolePermissions(String roleName, List<String> permissionCodes);
    
    /**
     * 사용자 권한 캐시 클리어
     * @param roleName 역할명
     */
    void clearUserPermissionCache(String roleName);
    
    // ==================== PermissionMatrix 마이그레이션 메서드 ====================
    
    /**
     * 사용자가 특정 메뉴 그룹에 접근할 수 있는지 확인
     * @param user 사용자 객체
     * @param menuGroup 메뉴 그룹 (예: "COMMON_MENU", "ADMIN_MENU")
     * @return 메뉴 그룹 접근 권한 여부
     */
    boolean hasMenuGroupAccess(User user, String menuGroup);
    
    /**
     * 역할이 특정 메뉴 그룹에 접근할 수 있는지 확인
     * @param roleName 역할명
     * @param menuGroup 메뉴 그룹 (예: "COMMON_MENU", "ADMIN_MENU")
     * @return 메뉴 그룹 접근 권한 여부
     */
    boolean hasMenuGroupAccess(String roleName, String menuGroup);
    
    /**
     * 사용자가 특정 API 경로에 접근할 수 있는지 확인
     * @param user 사용자 객체
     * @param apiPath API 경로 (예: "/api/admin/users", "/api/hq/branches")
     * @return API 접근 권한 여부
     */
    boolean hasApiAccess(User user, String apiPath);
    
    /**
     * 역할이 특정 API 경로에 접근할 수 있는지 확인
     * @param roleName 역할명
     * @param apiPath API 경로 (예: "/api/admin/users", "/api/hq/branches")
     * @return API 접근 권한 여부
     */
    boolean hasApiAccess(String roleName, String apiPath);
}