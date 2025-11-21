package com.coresolution.consultation.constant;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 사용자 역할별 권한 매트릭스
 * 각 역할이 접근 가능한 메뉴와 API를 정의
 * 
 * <p><b>⚠️ Deprecated 경고:</b> 이 클래스는 정적 권한 매트릭스를 사용하며, 
 * Phase 3.4에서 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.</p>
 * 
 * <p><b>권장 사용:</b> 새로운 코드에서는 {@link com.coresolution.consultation.service.DynamicPermissionService}를 사용하세요.
 * 이 클래스는 하위 호환성을 위해 유지되지만, 점진적으로 마이그레이션될 예정입니다.</p>
 * 
 * <h3>마이그레이션 가이드:</h3>
 * <ul>
 *   <li>{@code PermissionMatrix.hasMenuAccess(role, menuGroup)} 
 *       → {@code dynamicPermissionService.hasMenuGroupAccess(roleName, menuGroup)}</li>
 *   <li>{@code PermissionMatrix.hasApiAccess(role, apiPath)} 
 *       → {@code dynamicPermissionService.hasApiAccess(roleName, apiPath)}</li>
 *   <li>{@code PermissionMatrix.hasFeature(role, feature)} 
 *       → {@code dynamicPermissionService.hasPermission(roleName, feature)}</li>
 *   <li>{@code PermissionMatrix.getRolePermissions(role)} 
 *       → {@code dynamicPermissionService.getRolePermissions(roleName)}</li>
 * </ul>
 * 
 * <p><b>변경 사항:</b> Phase 3.4에서 모든 권한 정보가 데이터베이스로 마이그레이션되었습니다.
 * 권한 변경은 이제 코드 수정 없이 데이터베이스에서 관리할 수 있습니다.</p>
 * 
 * @author MindGarden
 * @version 2.0.0 (Deprecated 추가)
 * @since 2025-01-17
 * @deprecated 정적 권한 매트릭스는 {@link com.coresolution.consultation.service.DynamicPermissionService}로 마이그레이션됨
 * @see com.coresolution.consultation.service.DynamicPermissionService
 */
@Deprecated
public class PermissionMatrix {
    
    /**
     * 역할별 접근 가능한 메뉴 그룹
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             데이터베이스의 {@code permissions} 테이블과 {@code role_permissions} 테이블을 사용하세요.
     */
    @Deprecated
    public static final Map<UserRole, List<String>> ROLE_MENU_GROUPS = new HashMap<>();
    
    /**
     * 역할별 접근 가능한 API 패턴
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             데이터베이스의 {@code permissions} 테이블과 {@code role_permissions} 테이블을 사용하세요.
     */
    @Deprecated
    public static final Map<UserRole, List<String>> ROLE_API_PATTERNS = new HashMap<>();
    
    /**
     * 역할별 접근 가능한 기능
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             데이터베이스의 {@code permissions} 테이블과 {@code role_permissions} 테이블을 사용하세요.
     */
    @Deprecated
    public static final Map<UserRole, List<String>> ROLE_FEATURES = new HashMap<>();
    
    static {
        initializeMenuGroups();
        initializeApiPatterns();
        initializeFeatures();
    }
    
    /**
     * 역할별 메뉴 그룹 초기화
     */
    private static void initializeMenuGroups() {
        // CLIENT (내담자)
        ROLE_MENU_GROUPS.put(UserRole.CLIENT, Arrays.asList(
            "COMMON_MENU",
            "CLIENT_MENU"
        ));
        
        // CONSULTANT (상담사)
        ROLE_MENU_GROUPS.put(UserRole.CONSULTANT, Arrays.asList(
            "COMMON_MENU",
            "CONSULTANT_MENU"
        ));
        
        // ADMIN (지점 관리자)
        ROLE_MENU_GROUPS.put(UserRole.ADMIN, Arrays.asList(
            "COMMON_MENU",
            "ADMIN_MENU"
        ));
        
        // BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
        ROLE_MENU_GROUPS.put(UserRole.BRANCH_SUPER_ADMIN, Arrays.asList(
            "COMMON_MENU",
            "ADMIN_MENU",
            "BRANCH_SUPER_ADMIN_MENU"
        ));
        
        // HQ_ADMIN (본사 관리자)
        ROLE_MENU_GROUPS.put(UserRole.HQ_ADMIN, Arrays.asList(
            "COMMON_MENU",
            "HQ_ADMIN_MENU"
        ));
        
        // SUPER_HQ_ADMIN (본사 고급 관리자)
        ROLE_MENU_GROUPS.put(UserRole.SUPER_HQ_ADMIN, Arrays.asList(
            "COMMON_MENU",
            "HQ_ADMIN_MENU"
        ));
        
        // HQ_MASTER (본사 총관리자) - 모든 메뉴 접근 가능
        ROLE_MENU_GROUPS.put(UserRole.HQ_MASTER, Arrays.asList(
            "COMMON_MENU",
            "ADMIN_MENU",
            "HQ_ADMIN_MENU",
            "BRANCH_SUPER_ADMIN_MENU",
            "CONSULTANT_MENU",
            "CLIENT_MENU"
        ));
        
        // BRANCH_MANAGER (지점장) - 기존 호환성
        ROLE_MENU_GROUPS.put(UserRole.BRANCH_MANAGER, Arrays.asList(
            "COMMON_MENU",
            "ADMIN_MENU"
        ));
        
        // HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
        ROLE_MENU_GROUPS.put(UserRole.HQ_SUPER_ADMIN, Arrays.asList(
            "COMMON_MENU",
            "HQ_ADMIN_MENU"
        ));
    }
    
    /**
     * 역할별 API 패턴 초기화
     */
    private static void initializeApiPatterns() {
        // CLIENT (내담자)
        ROLE_API_PATTERNS.put(UserRole.CLIENT, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/client/**",
            "/api/v1/consultations/**",
            "/api/consultation-messages/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/sms-auth/**"
        ));
        
        // CONSULTANT (상담사)
        ROLE_API_PATTERNS.put(UserRole.CONSULTANT, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/consultant/**",
            "/api/v1/consultants/**",
            "/api/v1/consultations/**",
            "/api/consultation-messages/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/sms-auth/**"
        ));
        
        // ADMIN (지점 관리자)
        ROLE_API_PATTERNS.put(UserRole.ADMIN, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/admin/**",
            "/api/consultation-messages/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
        
        // BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
        ROLE_API_PATTERNS.put(UserRole.BRANCH_SUPER_ADMIN, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/admin/**",
            "/api/consultation-messages/**",
            "/api/erp/**",
            "/api/payments/**",
            "/api/accounts/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
        
        // HQ_ADMIN (본사 관리자)
        ROLE_API_PATTERNS.put(UserRole.HQ_ADMIN, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/hq/**",
            "/api/consultation-messages/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
        
        // SUPER_HQ_ADMIN (본사 고급 관리자)
        ROLE_API_PATTERNS.put(UserRole.SUPER_HQ_ADMIN, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/admin/**",
            "/api/hq/**",
            "/api/consultation-messages/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
        
        // HQ_MASTER (본사 총관리자) - 모든 API 접근 가능
        ROLE_API_PATTERNS.put(UserRole.HQ_MASTER, Arrays.asList(
            "/api/**"
        ));
        
        // BRANCH_MANAGER (지점장) - 기존 호환성
        ROLE_API_PATTERNS.put(UserRole.BRANCH_MANAGER, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/admin/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
        
        // HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
        ROLE_API_PATTERNS.put(UserRole.HQ_SUPER_ADMIN, Arrays.asList(
            "/api/auth/**",
            "/api/menu/**",
            "/api/user/**",
            "/api/users/**",
            "/api/admin/**",
            "/api/hq/**",
            "/api/schedules/**",
            "/api/ratings/**",
            "/api/motivation/**",
            "/api/branches/**",
            "/api/sms-auth/**"
        ));
    }
    
    /**
     * 역할별 기능 초기화
     */
    private static void initializeFeatures() {
        // CLIENT (내담자)
        ROLE_FEATURES.put(UserRole.CLIENT, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_OWN_CONSULTATIONS",
            "CREATE_CONSULTATION_REQUEST",
            "SEND_MESSAGE",
            "RATE_CONSULTANT",
            "VIEW_MOTIVATION"
        ));
        
        // CONSULTANT (상담사)
        ROLE_FEATURES.put(UserRole.CONSULTANT, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ASSIGNED_CONSULTATIONS",
            "UPDATE_CONSULTATION_STATUS",
            "SEND_MESSAGE",
            "VIEW_CLIENT_RATINGS",
            "VIEW_MOTIVATION",
            "MANAGE_SCHEDULE"
        ));
        
        // ADMIN (지점 관리자)
        ROLE_FEATURES.put(UserRole.ADMIN, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_USERS",
            "MANAGE_CONSULTANTS",
            "MANAGE_CLIENTS",
            "VIEW_STATISTICS",
            "MANAGE_SCHEDULES",
            "VIEW_RATINGS",
            "MANAGE_BRANCH_SETTINGS"
        ));
        
        // BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
        ROLE_FEATURES.put(UserRole.BRANCH_SUPER_ADMIN, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_USERS",
            "MANAGE_CONSULTANTS",
            "MANAGE_CLIENTS",
            "VIEW_STATISTICS",
            "MANAGE_SCHEDULES",
            "VIEW_RATINGS",
            "MANAGE_BRANCH_SETTINGS",
            "MANAGE_ERP",
            "MANAGE_PAYMENTS",
            "MANAGE_ACCOUNTS",
            "APPROVE_PURCHASE_REQUESTS"
        ));
        
        // HQ_ADMIN (본사 관리자)
        ROLE_FEATURES.put(UserRole.HQ_ADMIN, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_ALL_USERS",
            "MANAGE_ALL_CONSULTANTS",
            "MANAGE_ALL_CLIENTS",
            "VIEW_ALL_STATISTICS",
            "MANAGE_ALL_SCHEDULES",
            "VIEW_ALL_RATINGS",
            "MANAGE_ALL_BRANCHES",
            "MANAGE_SYSTEM_SETTINGS"
        ));
        
        // SUPER_HQ_ADMIN (본사 고급 관리자)
        ROLE_FEATURES.put(UserRole.SUPER_HQ_ADMIN, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_ALL_USERS",
            "MANAGE_ALL_CONSULTANTS",
            "MANAGE_ALL_CLIENTS",
            "VIEW_ALL_STATISTICS",
            "MANAGE_ALL_SCHEDULES",
            "VIEW_ALL_RATINGS",
            "MANAGE_ALL_BRANCHES",
            "MANAGE_SYSTEM_SETTINGS",
            "MANAGE_ADMIN_USERS"
        ));
        
        // HQ_MASTER (본사 총관리자) - 모든 기능 접근 가능
        ROLE_FEATURES.put(UserRole.HQ_MASTER, Arrays.asList(
            "ALL_FEATURES"
        ));
        
        // BRANCH_MANAGER (지점장) - 기존 호환성
        ROLE_FEATURES.put(UserRole.BRANCH_MANAGER, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_USERS",
            "MANAGE_CONSULTANTS",
            "MANAGE_CLIENTS",
            "VIEW_STATISTICS",
            "MANAGE_SCHEDULES",
            "VIEW_RATINGS",
            "MANAGE_BRANCH_SETTINGS"
        ));
        
        // HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
        ROLE_FEATURES.put(UserRole.HQ_SUPER_ADMIN, Arrays.asList(
            "VIEW_OWN_PROFILE",
            "EDIT_OWN_PROFILE",
            "VIEW_ALL_CONSULTATIONS",
            "MANAGE_ALL_USERS",
            "MANAGE_ALL_CONSULTANTS",
            "MANAGE_ALL_CLIENTS",
            "VIEW_ALL_STATISTICS",
            "MANAGE_ALL_SCHEDULES",
            "VIEW_ALL_RATINGS",
            "MANAGE_ALL_BRANCHES",
            "MANAGE_SYSTEM_SETTINGS"
        ));
    }
    
    /**
     * 특정 역할이 메뉴 그룹에 접근 가능한지 확인
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             {@link com.coresolution.consultation.service.DynamicPermissionService#hasMenuGroupAccess}를 사용하세요.
     *             
     * <p><b>마이그레이션 예시:</b></p>
     * <pre>{@code
     * // 기존 코드
     * PermissionMatrix.hasMenuAccess(role, "ADMIN_MENU");
     * 
     * // 새 코드
     * dynamicPermissionService.hasMenuGroupAccess(role.name(), "ADMIN_MENU");
     * }</pre>
     */
    @Deprecated
    public static boolean hasMenuAccess(UserRole role, String menuGroup) {
        List<String> allowedGroups = ROLE_MENU_GROUPS.get(role);
        return allowedGroups != null && allowedGroups.contains(menuGroup);
    }
    
    /**
     * 특정 역할이 API 패턴에 접근 가능한지 확인
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             {@link com.coresolution.consultation.service.DynamicPermissionService#hasApiAccess}를 사용하세요.
     *             
     * <p><b>마이그레이션 예시:</b></p>
     * <pre>{@code
     * // 기존 코드
     * PermissionMatrix.hasApiAccess(role, "/api/admin/users");
     * 
     * // 새 코드
     * dynamicPermissionService.hasApiAccess(role.name(), "/api/admin/users");
     * }</pre>
     */
    @Deprecated
    public static boolean hasApiAccess(UserRole role, String apiPath) {
        List<String> allowedPatterns = ROLE_API_PATTERNS.get(role);
        if (allowedPatterns == null) return false;
        
        // HQ_MASTER는 모든 API 접근 가능
        if (allowedPatterns.contains("/api/**")) {
            return true;
        }
        
        // 패턴 매칭 확인
        for (String pattern : allowedPatterns) {
            if (apiPath.matches(pattern.replace("/**", ".*"))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 특정 역할이 기능을 사용할 수 있는지 확인
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             {@link com.coresolution.consultation.service.DynamicPermissionService#hasPermission}을 사용하세요.
     *             
     * <p><b>마이그레이션 예시:</b></p>
     * <pre>{@code
     * // 기존 코드
     * PermissionMatrix.hasFeature(role, "MANAGE_USERS");
     * 
     * // 새 코드
     * dynamicPermissionService.hasPermission(role.name(), "MANAGE_USERS");
     * }</pre>
     */
    @Deprecated
    public static boolean hasFeature(UserRole role, String feature) {
        List<String> allowedFeatures = ROLE_FEATURES.get(role);
        if (allowedFeatures == null) return false;
        
        // HQ_MASTER는 모든 기능 접근 가능
        if (allowedFeatures.contains("ALL_FEATURES")) {
            return true;
        }
        
        return allowedFeatures.contains(feature);
    }
    
    /**
     * 역할별 권한 정보 조회
     * 
     * @deprecated 정적 권한 매트릭스는 데이터베이스 기반 동적 권한 시스템으로 마이그레이션되었습니다.
     *             {@link com.coresolution.consultation.service.DynamicPermissionService#getRolePermissions}을 사용하세요.
     *             
     * <p><b>마이그레이션 예시:</b></p>
     * <pre>{@code
     * // 기존 코드
     * PermissionMatrix.getRolePermissions(role);
     * 
     * // 새 코드
     * dynamicPermissionService.getRolePermissions(role.name());
     * }</pre>
     */
    @Deprecated
    public static Map<String, Object> getRolePermissions(UserRole role) {
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("role", role);
        permissions.put("menuGroups", ROLE_MENU_GROUPS.get(role));
        permissions.put("apiPatterns", ROLE_API_PATTERNS.get(role));
        permissions.put("features", ROLE_FEATURES.get(role));
        return permissions;
    }
}
