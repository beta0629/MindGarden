package com.mindgarden.consultation.util;

import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;

/**
 * 보안 관련 공통 유틸리티 클래스
 * 권한 체크 및 리다이렉트 처리를 통합 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public class SecurityUtils {
    
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
     */
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
     */
    public static boolean hasRole(HttpSession session, UserRole requiredRole) {
        return hasAnyRole(session, requiredRole);
    }
    
    /**
     * 본사 사용자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 본사 사용자 여부
     */
    public static boolean isHQUser(HttpSession session) {
        return hasAnyRole(session, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN, UserRole.HQ_ADMIN);
    }
    
    /**
     * 관리자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 관리자 여부
     */
    public static boolean isAdmin(HttpSession session) {
        return hasAnyRole(session, UserRole.ADMIN, UserRole.BRANCH_SUPER_ADMIN, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN);
    }
    
    /**
     * 지점 관리자 권한 확인
     * 
     * @param session HTTP 세션
     * @return 지점 관리자 여부
     */
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
     */
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
     */
    public static ResponseEntity<Map<String, Object>> checkHQPermission(HttpSession session) {
        return checkPermission(session, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN, UserRole.HQ_ADMIN);
    }
    
    /**
     * 관리자 권한 체크
     * 
     * @param session HTTP 세션
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     */
    public static ResponseEntity<Map<String, Object>> checkAdminPermission(HttpSession session) {
        return checkPermission(session, UserRole.ADMIN, UserRole.BRANCH_SUPER_ADMIN, UserRole.HQ_MASTER, UserRole.SUPER_HQ_ADMIN);
    }
    
    /**
     * 지점 관리자 권한 체크
     * 
     * @param session HTTP 세션
     * @return 권한 있으면 null, 없으면 FORBIDDEN 응답
     */
    public static ResponseEntity<Map<String, Object>> checkBranchAdminPermission(HttpSession session) {
        return checkPermission(session, UserRole.BRANCH_SUPER_ADMIN, UserRole.ADMIN);
    }
}
