package com.coresolution.consultation.utils;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.service.UserRoleQueryService;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 세션 관리 유틸리티 (표준화)
 * 
 * 모든 세션 속성 접근은 이 클래스의 메서드를 통해야 합니다.
 * 하드코딩된 세션 속성명 사용을 금지합니다.
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@Component
public class SessionUtils implements ApplicationContextAware {
    
    private static ApplicationContext applicationContext;
    
    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        SessionUtils.applicationContext = applicationContext;
    }
    
    /**
     * UserRoleQueryService 인스턴스 가져오기
     */
    private static UserRoleQueryService getUserRoleQueryService() {
        if (applicationContext == null) {
            return null;
        }
        try {
            return applicationContext.getBean(UserRoleQueryService.class);
        } catch (Exception e) {
            log.warn("UserRoleQueryService를 가져올 수 없습니다: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * 현재 사용자 정보 조회
     * 1. 세션에서 조회 (우선순위 1)
     * 2. SecurityContext에서 조회 (세션이 null이거나 사용자 정보가 없을 때)
     */
    public static User getCurrentUser(HttpSession session) {
        // 1. 세션이 있으면 세션에서 조회 (표준화된 상수 사용)
        if (session != null) {
            User sessionUser = (User) session.getAttribute(SessionConstants.USER_OBJECT);
            if (sessionUser != null) {
                return sessionUser;
            }
        }
        
        // 2. 세션이 null이거나 사용자 정보가 없으면 SecurityContext에서 조회
        // (SessionBasedAuthenticationFilter에서 데이터베이스 조회 후 SecurityContext에 설정한 경우)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            // details에서 User 객체 조회 (createAuthentication에서 setDetails(user)로 설정됨)
            Object details = authentication.getDetails();
            if (details instanceof User) {
                return (User) details;
            }
            
            // principal이 User 객체인 경우 (드물지만 가능)
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                return (User) principal;
            }
        }
        
        return null;
    }
    
    /**
     * 사용자 로그인 여부 확인
     */
    public static boolean isLoggedIn(HttpSession session) {
        return getCurrentUser(session) != null;
    }
    
    /**
     * User 객체를 세션에 저장
     */
    public static void setCurrentUser(HttpSession session, User user) {
        if (session != null && user != null) {
            session.setAttribute(SessionConstants.USER_OBJECT, user);
        }
    }
    
    /**
     * 세션 무효화
     */
    public static void clearSession(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }
    
    /**
     * 테넌트 ID 조회
     * 1. 세션에서 직접 조회 (캐시된 값)
     * 2. User 객체에서 추출
     */
    public static String getTenantId(HttpSession session) {
        if (session == null) {
            return null;
        }
        
        // 1. 세션에서 직접 조회 시도
        String tenantId = (String) session.getAttribute(SessionConstants.TENANT_ID);
        if (tenantId != null) {
            return tenantId;
        }
        
        // 2. User 객체에서 추출
        User user = getCurrentUser(session);
        if (user != null && user.getTenantId() != null) {
            // 세션에 캐싱
            session.setAttribute(SessionConstants.TENANT_ID, user.getTenantId());
            return user.getTenantId();
        }
        
        return null;
    }
    
    /**
     * 역할 ID (tenant_role_id) 조회
     * 1. 세션에서 직접 조회 (캐시된 값)
     * 2. UserRoleQueryService를 통해 데이터베이스에서 조회
     * 3. 조회 성공 시 세션에 캐싱
     */
    public static String getRoleId(HttpSession session) {
        if (session == null) {
            return null;
        }
        
        // 1. 세션에서 직접 조회 시도
        String roleId = (String) session.getAttribute(SessionConstants.ROLE_ID);
        if (roleId != null) {
            return roleId;
        }
        
        // 2. UserRoleQueryService를 통해 데이터베이스에서 조회
        User user = getCurrentUser(session);
        if (user == null) {
            return null;
        }
        
        String tenantId = getTenantId(session);
        if (tenantId == null) {
            log.info("⚠️ roleId 조회 실패: tenantId가 없습니다. userId={}", user.getId());
            return null;
        }
        
        UserRoleQueryService userRoleQueryService = getUserRoleQueryService();
        if (userRoleQueryService == null) {
            log.warn("⚠️ UserRoleQueryService를 사용할 수 없습니다. userId={}, tenantId={}", user.getId(), tenantId);
            return null;
        }
        
        try {
            log.info("🔍 roleId 조회 시도 (DB): userId={}, tenantId={}", user.getId(), tenantId);
            var primaryRole = userRoleQueryService.getPrimaryRole(user, tenantId);
            if (primaryRole.isPresent()) {
                roleId = primaryRole.get().getTenantRoleId();
                // 세션에 캐싱
                session.setAttribute(SessionConstants.ROLE_ID, roleId);
                log.info("✅ roleId 조회 성공 (DB): userId={}, tenantId={}, roleId={}", 
                    user.getId(), tenantId, roleId);
                return roleId;
            } else {
                log.warn("⚠️ 활성 역할 할당이 없습니다: userId={}, tenantId={}, role={}", 
                    user.getId(), tenantId, user.getRole());
            }
        } catch (Exception e) {
            log.error("❌ roleId 조회 중 오류 발생: userId={}, tenantId={}, error={}", 
                user.getId(), tenantId, e.getMessage(), e);
        }
        
        return null;
    }
    
    /**
     * 역할 (UserRole enum) 조회
     */
    public static UserRole getRole(HttpSession session) {
        User user = getCurrentUser(session);
        return user != null ? user.getRole() : null;
    }
    
    /**
     * 역할 이름 (String) 조회
     */
    public static String getRoleName(HttpSession session) {
        UserRole role = getRole(session);
        return role != null ? role.name() : null;
    }
    
    /**
     * 관리자 여부 확인
     * 
     * 표준 관리자 역할만 확인 (브랜치/본사 개념 제거)
     * 
     * 표준 역할 (TENANT_ROLE_SYSTEM_STANDARD.md 참조):
     * - ADMIN: 기본 관리자
     * - TENANT_ADMIN: 테넌트 관리자
     * - PRINCIPAL: 원장
     * - OWNER: 사장
     * 
     * 제거된 레거시 역할:
     * - BRANCH_ADMIN, BRANCH_SUPER_ADMIN, BRANCH_MANAGER (브랜치 개념 제거)
     * - HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER, HQ_SUPER_ADMIN (본사 개념 제거)
     */
    public static boolean isAdmin(HttpSession session) {
        UserRole role = getRole(session);
        if (role == null) {
            return false;
        }
        // 표준 관리자 역할만 (브랜치/본사 레거시 역할 제외) (표준화 2025-12-05: enum 활용)
        return role == UserRole.ADMIN || 
               role == UserRole.TENANT_ADMIN ||
               role == UserRole.PRINCIPAL ||
               role == UserRole.OWNER;
    }
}
