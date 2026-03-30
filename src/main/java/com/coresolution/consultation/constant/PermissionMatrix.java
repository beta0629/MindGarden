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
        
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
        // 레거시 역할은 더 이상 사용하지 않으므로 매핑 제거
        // 하위 호환성이 필요한 경우 ADMIN 역할에 통합된 권한이 적용됨
        
        // 표준화 2025-12-05: 레거시 역할 제거
        // HQ_SUPER_ADMIN은 더 이상 사용하지 않음
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
        
        // 표준화 2025-12-05: BRANCH_SUPER_ADMIN → ADMIN으로 통합
        // BRANCH_SUPER_ADMIN의 권한은 이미 ADMIN에 포함됨
        
        // 표준화 2025-12-05: HQ_ADMIN → ADMIN으로 통합
        // HQ_ADMIN의 권한은 이미 ADMIN에 포함됨
        
        // 표준화 2025-12-05: 레거시 역할 제거
        // 레거시 역할은 더 이상 사용하지 않으므로 매핑 제거
        // 하위 호환성이 필요한 경우 ADMIN 역할에 통합된 권한이 적용됨
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
        
        // 표준화 2025-12-05: BRANCH_SUPER_ADMIN → ADMIN으로 통합
        // BRANCH_SUPER_ADMIN의 권한은 이미 ADMIN에 포함됨
        
        // 표준화 2025-12-05: HQ_ADMIN → ADMIN으로 통합
        // HQ_ADMIN의 권한은 이미 ADMIN에 포함됨
        
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
        // 레거시 역할은 더 이상 사용하지 않으므로 매핑 제거
        // 하위 호환성이 필요한 경우 ADMIN 역할에 통합된 권한이 적용됨
        
        // 표준 관리자 역할 (ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER) - 모든 기능 접근 가능
        // ROLE_FEATURES.put는 이미 위에서 ADMIN에 대해 정의됨
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
        
        // 표준화 2025-12-05: 레거시 역할 제거
        // 표준 관리자 역할은 모든 기능 접근 가능
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
