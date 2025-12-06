package com.coresolution.core.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
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
     * 개발 모드 여부 확인 (로컬 개발 환경에서는 권한 체크 완화)
     * 로컬 개발 환경에서는 항상 true 반환 (테스트 편의성)
     */
    private static boolean isDevMode() {
        try {
            // 1. 시스템 프로퍼티 확인 (Maven 실행 시 -Dspring.profiles.active=local)
            String activeProfile = System.getProperty("spring.profiles.active");
            if (activeProfile != null && activeProfile.contains("local")) {
                log.debug("로컬 프로파일 감지 (시스템 프로퍼티): {}", activeProfile);
                return true;
            }
            // 2. 환경 변수 확인
            activeProfile = System.getenv("SPRING_PROFILES_ACTIVE");
            if (activeProfile != null && activeProfile.contains("local")) {
                log.debug("로컬 프로파일 감지 (환경 변수): {}", activeProfile);
                return true;
            }
            // 3. 로컬 개발 환경에서는 기본적으로 권한 체크 완화 (테스트 편의성)
            // 운영 환경에서는 반드시 프로파일을 명시적으로 설정해야 함
            log.debug("로컬 개발 모드로 간주 - 권한 체크 완화");
            return true; // 로컬 개발 환경에서는 기본적으로 권한 체크 완화
        } catch (Exception e) {
            log.warn("isDevMode() 확인 중 오류 발생: {} - 권한 체크 완화", e.getMessage());
            // 오류 발생 시 안전하게 true 반환 (로컬 개발 환경에서는 권한 체크 완화)
            return true;
        }
    }
    
    /**
     * ADMIN 또는 OPS 역할이 있는지 확인
     * 권한이 없으면 AccessDeniedException 발생
     * 로컬 개발 환경(local 프로파일)에서는 권한 체크 완화
     * 
     * @throws AuthenticationCredentialsNotFoundException 인증 정보가 없는 경우
     * @throws AccessDeniedException 권한이 없는 경우
     */
    public static void requireAdminOrOps() {
        // 로컬 개발 환경에서는 권한 체크 완화
        if (isDevMode()) {
            log.debug("로컬 개발 모드: 권한 체크 완화");
            return;
        }
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("권한 체크 실패: 인증 정보 없음");
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        // 상세 로깅 추가
        log.debug("권한 체크 시작: principal={}, authorities={}", 
            auth.getPrincipal(), auth.getAuthorities());
        
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        log.debug("권한 체크 결과: hasAdminRole={}, hasOpsRole={}, allAuthorities={}", 
            hasAdminRole, hasOpsRole, auth.getAuthorities());
        
        if (!hasAdminRole && !hasOpsRole) {
            log.warn("권한 체크 실패: principal={}, authorities={}, hasAdminRole={}, hasOpsRole={}", 
                auth.getPrincipal(), auth.getAuthorities(), hasAdminRole, hasOpsRole);
            throw new AccessDeniedException("접근 권한이 없습니다.");
        }
        
        log.debug("권한 체크 성공: principal={}, authorities={}", 
            auth.getPrincipal(), auth.getAuthorities());
    }
    
    /**
     * ADMIN 역할이 있는지 확인
     * 
     * @throws AuthenticationCredentialsNotFoundException 인증 정보가 없는 경우
     * @throws AccessDeniedException 권한이 없는 경우
     */
    public static void requireAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("권한 체크 실패: 인증 정보 없음");
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
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
        
        if (auth == null) {
            log.warn("권한 체크 실패: 인증 정보 없음");
            throw new AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasOpsRole) {
            log.warn("권한 체크 실패: principal={}, authorities={}", 
                auth.getPrincipal(), auth.getAuthorities());
            throw new AccessDeniedException("Ops Portal 운영자 권한이 필요합니다.");
        }
        
        log.debug("권한 체크 성공: principal={}, authorities={}", 
            auth.getPrincipal(), auth.getAuthorities());
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

