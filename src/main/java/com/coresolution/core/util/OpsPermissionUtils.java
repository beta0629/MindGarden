package com.coresolution.core.util;

import com.coresolution.core.constants.SecurityRoleConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Ops Portal 권한 체크 유틸리티
 * 
 * @PreAuthorize가 작동하지 않는 문제로 인해 수동 권한 체크를 위한 유틸리티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-23
 */
@Slf4j
public class OpsPermissionUtils {
    
    private OpsPermissionUtils() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    /**
     * ADMIN 역할이 있는지 확인
     * 
     * @throws AuthenticationCredentialsNotFoundException 인증 정보가 없는 경우
     * @throws AccessDeniedException 권한이 없는 경우
     */
    public static void requireAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || isAnonymous(auth)) {
            log.warn("권한 체크 실패: 인증 정보 없음");
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }

        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> SecurityRoleConstants.ROLE_ADMIN.equals(a.getAuthority()));

        if (!hasAdminRole) {
            log.warn("권한 체크 실패: principal={}, authorities={}",
                auth.getPrincipal(), auth.getAuthorities());
            throw new AccessDeniedException("관리자 권한이 필요합니다.");
        }

        log.debug("권한 체크 성공: principal={}, authorities={}",
            auth.getPrincipal(), auth.getAuthorities());
    }
    
    /**
     * OPS 역할이 있는지 확인
     * 
     * @throws AuthenticationCredentialsNotFoundException 인증 정보가 없는 경우
     * @throws AccessDeniedException 권한이 없는 경우
     */
    public static void requireOps() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || isAnonymous(auth)) {
            log.warn("권한 체크 실패: 인증 정보 없음");
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }

        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> SecurityRoleConstants.ROLE_OPS.equals(a.getAuthority()));

        if (!hasOpsRole) {
            log.warn("권한 체크 실패: principal={}, authorities={}",
                auth.getPrincipal(), auth.getAuthorities());
            throw new AccessDeniedException("Ops Portal 운영자 권한이 필요합니다.");
        }

        log.debug("권한 체크 성공: principal={}, authorities={}",
            auth.getPrincipal(), auth.getAuthorities());
    }

    /**
     * Spring Security 익명 인증 여부.
     *
     * @param auth 인증 객체
     * @return 익명이면 true
     */
    private static boolean isAnonymous(Authentication auth) {
        if (auth == null) {
            return true;
        }
        if (auth instanceof AnonymousAuthenticationToken) {
            return true;
        }
        return auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ANONYMOUS".equals(a.getAuthority()));
    }
    
    /**
     * 현재 인증된 사용자의 권한 정보 반환 (디버깅용)
     * 
     * @return 권한 정보 문자열
     */
    public static String getCurrentAuthorities() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return "인증 정보 없음";
        }
        return auth.getAuthorities().toString();
    }
}

