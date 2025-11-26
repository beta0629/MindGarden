/**
 * 업종별 API 접근 권한 상수 (동적 관리)
 * 하드코딩 금지 - 데이터베이스 또는 설정에서 동적으로 조회
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.constant;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import com.coresolution.core.service.BusinessTypePermissionService;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class BusinessTypePermissions {
    
    // 업종 타입 상수
    public static final String CONSULTATION = "CONSULTATION";
    public static final String ACADEMY = "ACADEMY";
    public static final String ERP = "ERP";
    public static final String COMMON = "COMMON";
    
    // API 카테고리
    public static final String API_CATEGORY_AUTH = "AUTH";
    public static final String API_CATEGORY_ADMIN = "ADMIN";
    public static final String API_CATEGORY_CONSULTATION = "CONSULTATION";
    public static final String API_CATEGORY_ACADEMY = "ACADEMY";
    public static final String API_CATEGORY_ERP = "ERP";
    public static final String API_CATEGORY_COMMON = "COMMON";
    
    // 권한 레벨
    public static final String PERMISSION_LEVEL_PUBLIC = "PUBLIC";
    public static final String PERMISSION_LEVEL_AUTHENTICATED = "AUTHENTICATED";
    public static final String PERMISSION_LEVEL_BUSINESS_TYPE = "BUSINESS_TYPE";
    public static final String PERMISSION_LEVEL_ROLE_BASED = "ROLE_BASED";
    public static final String PERMISSION_LEVEL_ADMIN_ONLY = "ADMIN_ONLY";
    
    @Autowired(required = false)
    private BusinessTypePermissionService permissionService;
    
    /**
     * 기본 API 권한 매핑 (임시, 향후 DB에서 조회)
     */
    private static final Map<String, ApiPermissionConfig> DEFAULT_API_PERMISSIONS = new HashMap<>();
    
    static {
        // 공통 API (모든 업종에서 접근 가능)
        addApiPermission("/api/auth/**", COMMON, PERMISSION_LEVEL_PUBLIC);
        addApiPermission("/api/admin/users/**", COMMON, PERMISSION_LEVEL_ADMIN_ONLY);
        addApiPermission("/api/admin/permissions/**", COMMON, PERMISSION_LEVEL_ADMIN_ONLY);
        addApiPermission("/api/schedules/**", COMMON, PERMISSION_LEVEL_AUTHENTICATED);
        addApiPermission("/api/payments/**", COMMON, PERMISSION_LEVEL_AUTHENTICATED);
        addApiPermission("/api/notifications/**", COMMON, PERMISSION_LEVEL_AUTHENTICATED);
        addApiPermission("/api/common-codes/**", COMMON, PERMISSION_LEVEL_PUBLIC);
        addApiPermission("/api/files/**", COMMON, PERMISSION_LEVEL_AUTHENTICATED);
        
        // 상담소 특화 API
        addApiPermission("/api/consultant/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/client/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/consultations/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/consultation-messages/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/admin/mappings/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/admin/sessions/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/admin/consultation-records/**", CONSULTATION, PERMISSION_LEVEL_BUSINESS_TYPE);
        
        // 학원 특화 API
        addApiPermission("/api/academy/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/courses/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/classes/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/enrollments/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/attendance/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        addApiPermission("/api/tuition/**", ACADEMY, PERMISSION_LEVEL_BUSINESS_TYPE);
        
        // ERP API (기능 활성화 시)
        addApiPermission("/api/erp/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
        addApiPermission("/api/purchase/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
        addApiPermission("/api/financial/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
        addApiPermission("/api/budget/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
        addApiPermission("/api/tax/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
        addApiPermission("/api/salary/**", ERP, PERMISSION_LEVEL_ROLE_BASED);
    }
    
    /**
     * API 권한 설정 추가 (헬퍼 메서드)
     */
    private static void addApiPermission(String pattern, String businessType, String permissionLevel) {
        DEFAULT_API_PERMISSIONS.put(pattern, new ApiPermissionConfig(
            pattern, businessType, permissionLevel, new ArrayList<>()
        ));
    }
    
    /**
     * 업종별 API 접근 권한 확인 (동적)
     * @param businessType 업종 타입
     * @param apiPath API 경로
     * @return 접근 권한 여부
     */
    @Cacheable(value = "businessTypeApiAccess", key = "#businessType + '_' + #apiPath")
    public boolean hasApiAccess(String businessType, String apiPath) {
        if (businessType == null || apiPath == null) {
            log.warn("업종 또는 API 경로가 null입니다: businessType={}, apiPath={}", businessType, apiPath);
            return false;
        }
        
        try {
            // 서비스에서 동적으로 조회 (우선순위)
            if (permissionService != null) {
                return permissionService.checkApiAccess(businessType, apiPath);
            }
            
            // 기본 설정에서 조회 (폴백)
            return checkApiAccessFromDefault(businessType, apiPath);
            
        } catch (Exception e) {
            log.error("API 접근 권한 확인 중 오류 발생: businessType={}, apiPath={}", businessType, apiPath, e);
            return false;
        }
    }
    
    /**
     * 기본 설정에서 API 접근 권한 확인
     */
    private boolean checkApiAccessFromDefault(String businessType, String apiPath) {
        for (Map.Entry<String, ApiPermissionConfig> entry : DEFAULT_API_PERMISSIONS.entrySet()) {
            String pattern = entry.getKey();
            ApiPermissionConfig config = entry.getValue();
            
            if (matchesPattern(apiPath, pattern)) {
                return isBusinessTypeAllowed(businessType, config);
            }
        }
        
        // 매칭되는 패턴이 없으면 거부
        log.debug("매칭되는 API 패턴이 없습니다: {}", apiPath);
        return false;
    }
    
    /**
     * 업종별 허용 여부 확인
     */
    private boolean isBusinessTypeAllowed(String businessType, ApiPermissionConfig config) {
        // 공통 API는 모든 업종에서 허용
        if (COMMON.equals(config.getBusinessType())) {
            return true;
        }
        
        // 특화 API는 해당 업종에서만 허용
        if (config.getBusinessType().equals(businessType)) {
            return true;
        }
        
        // ERP API는 ERP 기능이 활성화된 경우 허용 (향후 구현)
        if (ERP.equals(config.getBusinessType())) {
            return isErpEnabled(businessType);
        }
        
        return false;
    }
    
    /**
     * ERP 기능 활성화 여부 확인 (향후 구현)
     */
    private boolean isErpEnabled(String businessType) {
        // TODO: 테넌트별 ERP 기능 활성화 여부 확인
        // 현재는 모든 업종에서 ERP 사용 가능으로 설정
        return true;
    }
    
    /**
     * 패턴 매칭 (Ant 스타일)
     */
    private boolean matchesPattern(String path, String pattern) {
        if (pattern.equals(path)) {
            return true;
        }
        
        if (pattern.endsWith("/**")) {
            String prefix = pattern.substring(0, pattern.length() - 3);
            return path.startsWith(prefix);
        }
        
        if (pattern.endsWith("/*")) {
            String prefix = pattern.substring(0, pattern.length() - 2);
            return path.startsWith(prefix) && !path.substring(prefix.length()).contains("/");
        }
        
        // 와일드카드 패턴 매칭 (간단한 구현)
        if (pattern.contains("*")) {
            return matchesWildcard(path, pattern);
        }
        
        return false;
    }
    
    /**
     * 와일드카드 패턴 매칭
     */
    private boolean matchesWildcard(String text, String pattern) {
        String[] patternParts = pattern.split("\\*");
        int textIndex = 0;
        
        for (int i = 0; i < patternParts.length; i++) {
            String part = patternParts[i];
            if (part.isEmpty()) continue;
            
            int foundIndex = text.indexOf(part, textIndex);
            if (foundIndex == -1) {
                return false;
            }
            
            if (i == 0 && foundIndex != 0) {
                return false; // 첫 번째 부분은 시작 위치에 있어야 함
            }
            
            textIndex = foundIndex + part.length();
        }
        
        return true;
    }
    
    /**
     * 업종별 허용 API 패턴 목록 반환
     * @param businessType 업종 타입
     * @return 허용된 API 패턴 목록
     */
    @Cacheable(value = "businessTypeApiPatterns", key = "#businessType")
    public List<String> getAllowedApiPatterns(String businessType) {
        if (businessType == null) {
            return Collections.emptyList();
        }
        
        try {
            // 서비스에서 동적으로 조회 (우선순위)
            if (permissionService != null) {
                return permissionService.getAllowedApiPatterns(businessType);
            }
            
            // 기본 설정에서 조회 (폴백)
            return getAllowedApiPatternsFromDefault(businessType);
            
        } catch (Exception e) {
            log.error("허용 API 패턴 조회 중 오류 발생: businessType={}", businessType, e);
            return Collections.emptyList();
        }
    }
    
    /**
     * 기본 설정에서 허용 API 패턴 조회
     */
    private List<String> getAllowedApiPatternsFromDefault(String businessType) {
        return DEFAULT_API_PERMISSIONS.entrySet().stream()
            .filter(entry -> isBusinessTypeAllowed(businessType, entry.getValue()))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
    
    /**
     * API 권한 설정 조회
     * @param apiPath API 경로
     * @return API 권한 설정
     */
    public ApiPermissionConfig getApiPermissionConfig(String apiPath) {
        if (apiPath == null) {
            return null;
        }
        
        try {
            // 서비스에서 동적으로 조회 (우선순위)
            if (permissionService != null) {
                return permissionService.getApiPermissionConfig(apiPath);
            }
            
            // 기본 설정에서 조회 (폴백)
            return getApiPermissionConfigFromDefault(apiPath);
            
        } catch (Exception e) {
            log.error("API 권한 설정 조회 중 오류 발생: apiPath={}", apiPath, e);
            return null;
        }
    }
    
    /**
     * 기본 설정에서 API 권한 설정 조회
     */
    private ApiPermissionConfig getApiPermissionConfigFromDefault(String apiPath) {
        for (Map.Entry<String, ApiPermissionConfig> entry : DEFAULT_API_PERMISSIONS.entrySet()) {
            String pattern = entry.getKey();
            if (matchesPattern(apiPath, pattern)) {
                return entry.getValue();
            }
        }
        return null;
    }
    
    /**
     * 업종별 API 통계 반환
     * @param businessType 업종 타입
     * @return API 통계 정보
     */
    public ApiAccessStats getApiAccessStats(String businessType) {
        List<String> allowedPatterns = getAllowedApiPatterns(businessType);
        
        long commonApis = allowedPatterns.stream()
            .mapToLong(pattern -> DEFAULT_API_PERMISSIONS.get(pattern) != null && 
                     COMMON.equals(DEFAULT_API_PERMISSIONS.get(pattern).getBusinessType()) ? 1 : 0)
            .sum();
        
        long businessSpecificApis = allowedPatterns.size() - commonApis;
        
        return new ApiAccessStats(
            businessType,
            allowedPatterns.size(),
            (int) commonApis,
            (int) businessSpecificApis,
            allowedPatterns
        );
    }
    
    /**
     * API 권한 설정 클래스
     */
    public static class ApiPermissionConfig {
        private final String pattern;
        private final String businessType;
        private final String permissionLevel;
        private final List<String> requiredRoles;
        
        public ApiPermissionConfig(String pattern, String businessType, String permissionLevel, List<String> requiredRoles) {
            this.pattern = pattern;
            this.businessType = businessType;
            this.permissionLevel = permissionLevel;
            this.requiredRoles = requiredRoles != null ? new ArrayList<>(requiredRoles) : new ArrayList<>();
        }
        
        // Getters
        public String getPattern() { return pattern; }
        public String getBusinessType() { return businessType; }
        public String getPermissionLevel() { return permissionLevel; }
        public List<String> getRequiredRoles() { return new ArrayList<>(requiredRoles); }
    }
    
    /**
     * API 접근 통계 클래스
     */
    public static class ApiAccessStats {
        private final String businessType;
        private final int totalApis;
        private final int commonApis;
        private final int businessSpecificApis;
        private final List<String> allowedPatterns;
        
        public ApiAccessStats(String businessType, int totalApis, int commonApis, int businessSpecificApis, List<String> allowedPatterns) {
            this.businessType = businessType;
            this.totalApis = totalApis;
            this.commonApis = commonApis;
            this.businessSpecificApis = businessSpecificApis;
            this.allowedPatterns = new ArrayList<>(allowedPatterns);
        }
        
        // Getters
        public String getBusinessType() { return businessType; }
        public int getTotalApis() { return totalApis; }
        public int getCommonApis() { return commonApis; }
        public int getBusinessSpecificApis() { return businessSpecificApis; }
        public List<String> getAllowedPatterns() { return new ArrayList<>(allowedPatterns); }
    }
}
