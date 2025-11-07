package com.mindgarden.consultation.constant;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 사용자 역할별 권한 매트릭스
 * 각 역할이 접근 가능한 메뉴와 API를 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public class PermissionMatrix {
    
    /**
     * 역할별 접근 가능한 메뉴 그룹
     */
    public static final Map<UserRole, List<String>> ROLE_MENU_GROUPS = new HashMap<>();
    
    /**
     * 역할별 접근 가능한 API 패턴
     */
    public static final Map<UserRole, List<String>> ROLE_API_PATTERNS = new HashMap<>();
    
    /**
     * 역할별 접근 가능한 기능
     */
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
     */
    public static boolean hasMenuAccess(UserRole role, String menuGroup) {
        List<String> allowedGroups = ROLE_MENU_GROUPS.get(role);
        return allowedGroups != null && allowedGroups.contains(menuGroup);
    }
    
    /**
     * 특정 역할이 API 패턴에 접근 가능한지 확인
     */
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
     */
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
     */
    public static Map<String, Object> getRolePermissions(UserRole role) {
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("role", role);
        permissions.put("menuGroups", ROLE_MENU_GROUPS.get(role));
        permissions.put("apiPatterns", ROLE_API_PATTERNS.get(role));
        permissions.put("features", ROLE_FEATURES.get(role));
        return permissions;
    }
}
