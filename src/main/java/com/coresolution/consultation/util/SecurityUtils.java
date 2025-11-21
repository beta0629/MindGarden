package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.PermissionMatrix;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpSession;

/**
 * 보안 관련 공통 유틸리티 클래스
 * 권한 체크 및 리다이렉트 처리를 통합 관리
 * 
 * <p><b>⚠️ Deprecated 경고:</b> 이 클래스의 역할 기반 권한 체크 메서드들은 
 * {@link PermissionCheckUtils}로 마이그레이션되어야 합니다.</p>
 * 
 * <p><b>권장 사용:</b> 새로운 코드에서는 {@link PermissionCheckUtils}를 사용하세요.
 * 이 클래스는 하위 호환성을 위해 유지되지만, 점진적으로 마이그레이션될 예정입니다.</p>
 * 
 * <h3>마이그레이션 가이드:</h3>
 * <ul>
 *   <li>{@code SecurityUtils.checkPermission(session, UserRole.ADMIN)} 
 *       → {@code PermissionCheckUtils.checkPermission(session, "USER_MANAGE", dynamicPermissionService)}</li>
 *   <li>{@code SecurityUtils.checkHQPermission(session)} 
 *       → {@code PermissionCheckUtils.checkPermission(session, "HQ_ADMIN", dynamicPermissionService)}</li>
 * </ul>
 * 
 * @author MindGarden
 * @version 2.0.0 (Deprecated 메서드 추가)
 * @since 2025-01-17
 * @deprecated 역할 기반 권한 체크는 {@link PermissionCheckUtils}로 마이그레이션 권장
 * @see PermissionCheckUtils
 */
@Deprecated
@Component
public class SecurityUtils implements ApplicationContextAware {
    
    private static ApplicationContext applicationContext;
    
    @Override
    public void setApplicationContext(@org.springframework.lang.NonNull ApplicationContext context) throws BeansException {
        applicationContext = context;
    }
    
    /**
     * DynamicPermissionService를 ApplicationContext에서 가져오기
     */
    private static DynamicPermissionService getDynamicPermissionService() {
        if (applicationContext == null) {
            throw new IllegalStateException("ApplicationContext가 초기화되지 않았습니다. SecurityUtils는 Spring Bean으로 등록되어야 합니다.");
        }
        return applicationContext.getBean(DynamicPermissionService.class);
    }
    
    /**
     * 사용자 인증 상태 확인
     * 
     * @param session HTTP 세션
     * @return 인증된 사용자 또는 null
     */
    public static User getAuthenticatedUser(HttpSession session) {
        return SessionUtils.getCurrentUser(session);
    }
    
    /**
     * 사용자 인증 여부 확인
     * 
     * @param session HTTP 세션
     * @return 인증 여부
     */
    public static boolean isAuthenticated(HttpSession session) {
        return getAuthenticatedUser(session) != null;
    }
    
    /**
     * 특정 역할 권한 확인
     * 
     * @param session HTTP 세션
     * @param requiredRoles 필요한 역할들
     * @return 권한 여부
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static boolean hasAnyRole(HttpSession session, UserRole... requiredRoles) {
        User user = getAuthenticatedUser(session);
        if (user == null) {
            return false;
        }
        
        for (UserRole role : requiredRoles) {
            if (role.equals(user.getRole())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 특정 역할 권한 확인 (단일 역할)
     * 
     * @param session HTTP 세션
     * @param requiredRole 필요한 역할
     * @return 권한 여부
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static boolean hasRole(HttpSession session, UserRole requiredRole) {
        return hasAnyRole(session, requiredRole);
    }
    
    /**
     * 본사 사용자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 본사 사용자 여부
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static boolean isHQUser(HttpSession session) {
        return hasAnyRole(session, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN, UserRole.HQ_ADMIN);
    }
    
    /**
     * 관리자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 관리자 여부
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static boolean isAdmin(HttpSession session) {
        return hasAnyRole(session, UserRole.ADMIN, UserRole.BRANCH_SUPER_ADMIN, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN);
    }
    
    /**
     * 지점 관리자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 지점 관리자 여부
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static boolean isBranchAdmin(HttpSession session) {
        return hasAnyRole(session, UserRole.BRANCH_SUPER_ADMIN, UserRole.ADMIN);
    }
    
    /**
     * 권한 없음 응답 생성 (로그인 페이지 리다이렉트)
     * 
     * @param message 오류 메시지
     * @return FORBIDDEN 응답
     */
    public static ResponseEntity<Map<String, Object>> createForbiddenResponse(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of(
                "success", false,
                "message", message,
                "redirectToLogin", true
            ));
    }
    
    /**
     * 권한 없음 응답 생성 (기본 메시지)
     * 
     * @return FORBIDDEN 응답
     */
    public static ResponseEntity<Map<String, Object>> createForbiddenResponse() {
        return createForbiddenResponse("접근 권한이 없습니다.");
    }
    
    /**
     * 인증 필요 응답 생성 (로그인 페이지 리다이렉트)
     * 
     * @param message 오류 메시지
     * @return UNAUTHORIZED 응답
     */
    public static ResponseEntity<Map<String, Object>> createUnauthorizedResponse(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "success", false,
                "message", message,
                "redirectToLogin", true
            ));
    }
    
    /**
     * 인증 필요 응답 생성 (기본 메시지)
     * 
     * @return UNAUTHORIZED 응답
     */
    public static ResponseEntity<Map<String, Object>> createUnauthorizedResponse() {
        return createUnauthorizedResponse("로그인이 필요합니다.");
    }
    
    /**
     * 권한 체크 및 응답 생성
     * 
     * @param session HTTP 세션
     * @param requiredRoles 필요한 역할들
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     *             
     * <p><b>마이그레이션 예시:</b></p>
     * <pre>{@code
     * // 기존 코드
     * SecurityUtils.checkPermission(session, UserRole.ADMIN);
     * 
     * // 새 코드
     * PermissionCheckUtils.checkPermission(session, "USER_MANAGE", dynamicPermissionService);
     * }</pre>
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkPermission(HttpSession session, UserRole... requiredRoles) {
        if (!isAuthenticated(session)) {
            return createUnauthorizedResponse();
        }
        
        if (!hasAnyRole(session, requiredRoles)) {
            return createForbiddenResponse("해당 기능에 대한 접근 권한이 없습니다.");
        }
        
        return null; // 권한 있음
    }
    
    /**
     * 본사 사용자 권한 체크
     * 
     * @param session HTTP 세션
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkHQPermission(HttpSession session) {
        return checkPermission(session, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN, UserRole.HQ_ADMIN);
    }
    
    /**
     * 관리자 권한 체크
     * 
     * @param session HTTP 세션
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkAdminPermission}을 사용하세요.
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkAdminPermission(HttpSession session) {
        return checkPermission(session, UserRole.ADMIN, UserRole.BRANCH_SUPER_ADMIN, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN);
    }
    
    /**
     * 지점 관리자 권한 체크
     * 
     * @param session HTTP 세션
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 역할 기반 권한 체크는 하드코딩된 역할을 사용합니다. 
     *             동적 권한 시스템을 사용하려면 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkBranchAdminPermission(HttpSession session) {
        return checkPermission(session, UserRole.BRANCH_SUPER_ADMIN, UserRole.ADMIN);
    }
    
    /**
     * 메뉴 접근 권한 체크
     * 
     * @param session HTTP 세션
     * @param menuGroup 메뉴 그룹
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 이 메서드는 하위 호환성을 위해 유지되지만, 
     *             새로운 코드에서는 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     *             
     * <p><b>변경 사항:</b> Phase 3.4에서 DynamicPermissionService 기반으로 마이그레이션 완료.
     * 이제 데이터베이스 기반 동적 권한 시스템을 사용합니다.</p>
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkMenuPermission(HttpSession session, String menuGroup) {
        User user = getAuthenticatedUser(session);
        if (user == null) {
            return createUnauthorizedResponse();
        }
        
        try {
            // DynamicPermissionService를 사용하여 메뉴 그룹 권한 체크
            DynamicPermissionService dynamicPermissionService = getDynamicPermissionService();
            if (!dynamicPermissionService.hasMenuGroupAccess(user, menuGroup)) {
                return createForbiddenResponse("해당 메뉴에 접근할 권한이 없습니다.");
            }
        } catch (Exception e) {
            // 하위 호환성: DynamicPermissionService를 사용할 수 없는 경우 PermissionMatrix로 폴백
            if (!PermissionMatrix.hasMenuAccess(user.getRole(), menuGroup)) {
                return createForbiddenResponse("해당 메뉴에 접근할 권한이 없습니다.");
            }
        }
        
        return null;
    }
    
    /**
     * API 접근 권한 체크
     * 
     * @param session HTTP 세션
     * @param apiPath API 경로
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 이 메서드는 하위 호환성을 위해 유지되지만, 
     *             새로운 코드에서는 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     *             
     * <p><b>변경 사항:</b> Phase 3.4에서 DynamicPermissionService 기반으로 마이그레이션 완료.
     * 이제 데이터베이스 기반 동적 권한 시스템을 사용합니다.</p>
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkApiPermission(HttpSession session, String apiPath) {
        User user = getAuthenticatedUser(session);
        if (user == null) {
            return createUnauthorizedResponse();
        }
        
        try {
            // DynamicPermissionService를 사용하여 API 권한 체크
            DynamicPermissionService dynamicPermissionService = getDynamicPermissionService();
            if (!dynamicPermissionService.hasApiAccess(user, apiPath)) {
                return createForbiddenResponse("해당 API에 접근할 권한이 없습니다.");
            }
        } catch (Exception e) {
            // 하위 호환성: DynamicPermissionService를 사용할 수 없는 경우 PermissionMatrix로 폴백
            if (!PermissionMatrix.hasApiAccess(user.getRole(), apiPath)) {
                return createForbiddenResponse("해당 API에 접근할 권한이 없습니다.");
            }
        }
        
        return null;
    }
    
    /**
     * 기능 사용 권한 체크
     * 
     * @param session HTTP 세션
     * @param feature 기능명
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     * @deprecated 이 메서드는 하위 호환성을 위해 유지되지만, 
     *             새로운 코드에서는 {@link PermissionCheckUtils#checkPermission}을 사용하세요.
     *             
     * <p><b>변경 사항:</b> Phase 3.4에서 DynamicPermissionService 기반으로 마이그레이션 완료.
     * 이제 데이터베이스 기반 동적 권한 시스템을 사용합니다.</p>
     */
    @Deprecated
    public static ResponseEntity<Map<String, Object>> checkFeaturePermission(HttpSession session, String feature) {
        User user = getAuthenticatedUser(session);
        if (user == null) {
            return createUnauthorizedResponse();
        }
        
        try {
            // DynamicPermissionService를 사용하여 기능 권한 체크
            DynamicPermissionService dynamicPermissionService = getDynamicPermissionService();
            if (!dynamicPermissionService.hasPermission(user, feature)) {
                return createForbiddenResponse("해당 기능을 사용할 권한이 없습니다.");
            }
        } catch (Exception e) {
            // 하위 호환성: DynamicPermissionService를 사용할 수 없는 경우 PermissionMatrix로 폴백
            if (!PermissionMatrix.hasFeature(user.getRole(), feature)) {
                return createForbiddenResponse("해당 기능을 사용할 권한이 없습니다.");
            }
        }
        
        return null;
    }
    
    /**
     * 사용자 권한 정보 조회
     * 
     * @param session HTTP 세션
     * @return 사용자 권한 정보
     * @deprecated 이 메서드는 하위 호환성을 위해 유지되지만, 
     *             새로운 코드에서는 {@link DynamicPermissionService#getUserPermissions}을 직접 사용하세요.
     *             
     * <p><b>변경 사항:</b> Phase 3.4에서 DynamicPermissionService 기반으로 마이그레이션 완료.
     * 이제 데이터베이스 기반 동적 권한 시스템을 사용합니다.</p>
     * 
     * <p><b>응답 형식:</b> 기존과 동일한 형식을 유지합니다 (menuGroups, apiPatterns, features 포함).</p>
     */
    @Deprecated
    public static Map<String, Object> getUserPermissions(HttpSession session) {
        User user = getAuthenticatedUser(session);
        if (user == null) {
            return Map.of("authenticated", false);
        }
        
        try {
            // DynamicPermissionService를 사용하여 권한 정보 조회
            DynamicPermissionService dynamicPermissionService = getDynamicPermissionService();
            List<Map<String, Object>> permissionList = dynamicPermissionService.getUserPermissions(user);
            
            // 기존 응답 형식과 호환되도록 변환
            Map<String, Object> permissions = new HashMap<>();
            permissions.put("role", user.getRole().name());
            permissions.put("authenticated", true);
            permissions.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole().name(),
                "branchCode", user.getBranchCode() != null ? user.getBranchCode() : ""
            ));
            
            // 권한을 카테고리별로 분류
            List<String> menuGroups = new ArrayList<>();
            List<String> apiPatterns = new ArrayList<>();
            List<String> features = new ArrayList<>();
            
            for (Map<String, Object> perm : permissionList) {
                String permissionCode = (String) perm.get("permission_code");
                String category = (String) perm.get("category");
                
                if (permissionCode != null) {
                    if ("MENU".equals(category) && permissionCode.startsWith("MENU_GROUP_")) {
                        // MENU_GROUP_COMMON -> COMMON_MENU로 변환
                        String menuGroup = permissionCode.substring("MENU_GROUP_".length());
                        menuGroups.add(menuGroup);
                    } else if ("API".equals(category) && permissionCode.startsWith("API_ACCESS_")) {
                        // API_ACCESS_ADMIN -> /api/admin/**로 변환 (기존 형식 유지)
                        String apiPattern = mapPermissionCodeToApiPattern(permissionCode);
                        if (apiPattern != null) {
                            apiPatterns.add(apiPattern);
                        }
                    } else if ("FEATURE".equals(category)) {
                        features.add(permissionCode);
                    }
                }
            }
            
            permissions.put("menuGroups", menuGroups);
            permissions.put("apiPatterns", apiPatterns);
            permissions.put("features", features);
            
            return permissions;
            
        } catch (Exception e) {
            // 하위 호환성: DynamicPermissionService를 사용할 수 없는 경우 PermissionMatrix로 폴백
            Map<String, Object> permissions = PermissionMatrix.getRolePermissions(user.getRole());
            permissions.put("authenticated", true);
            permissions.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole().name(),
                "branchCode", user.getBranchCode() != null ? user.getBranchCode() : ""
            ));
            return permissions;
        }
    }
    
    /**
     * 권한 코드를 API 패턴으로 변환 (하위 호환성)
     */
    private static String mapPermissionCodeToApiPattern(String permissionCode) {
        if (permissionCode == null) {
            return null;
        }
        
        // API_ACCESS_ALL은 /api/**로 변환
        if ("API_ACCESS_ALL".equals(permissionCode)) {
            return "/api/**";
        }
        
        // API_ACCESS_* 형태를 /api/*/** 형태로 변환
        if (permissionCode.startsWith("API_ACCESS_")) {
            String apiName = permissionCode.substring("API_ACCESS_".length());
            
            // 특수 케이스 처리
            if ("AUTH".equals(apiName)) {
                return "/api/auth/**";
            } else if ("MENU".equals(apiName)) {
                return "/api/menu/**";
            } else if ("USER".equals(apiName)) {
                return "/api/user/**";
            } else if ("USERS".equals(apiName)) {
                return "/api/users/**";
            } else if ("CLIENT".equals(apiName)) {
                return "/api/client/**";
            } else if ("CONSULTANT".equals(apiName)) {
                return "/api/consultant/**";
            } else if ("CONSULTATIONS".equals(apiName)) {
                return "/api/v1/consultations/**";
            } else if ("CONSULTATION_MESSAGES".equals(apiName)) {
                return "/api/consultation-messages/**";
            } else if ("SCHEDULES".equals(apiName)) {
                return "/api/schedules/**";
            } else if ("RATINGS".equals(apiName)) {
                return "/api/ratings/**";
            } else if ("MOTIVATION".equals(apiName)) {
                return "/api/motivation/**";
            } else if ("SMS_AUTH".equals(apiName)) {
                return "/api/sms-auth/**";
            } else if ("ADMIN".equals(apiName)) {
                return "/api/admin/**";
            } else if ("HQ".equals(apiName)) {
                return "/api/hq/**";
            } else if ("ERP".equals(apiName)) {
                return "/api/erp/**";
            } else if ("PAYMENTS".equals(apiName)) {
                return "/api/payments/**";
            } else if ("ACCOUNTS".equals(apiName)) {
                return "/api/accounts/**";
            } else if ("BRANCHES".equals(apiName)) {
                return "/api/branches/**";
            }
        }
        
        return null;
    }
}
