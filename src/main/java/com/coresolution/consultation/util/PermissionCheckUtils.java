package com.coresolution.consultation.util;

import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 체크 공통 유틸리티 (표준)
 * 
 * <p>CoreSolution 플랫폼의 <b>표준 권한 체크 유틸리티</b>입니다.
 * 모든 Controller에서 일관성 있게 권한을 체크하기 위해 사용합니다.</p>
 * 
 * <h3>핵심 원칙:</h3>
 * <ul>
 *   <li>✅ 동적 권한 시스템 사용: DynamicPermissionService 기반</li>
 *   <li>✅ 일관된 응답 형식: ResponseEntity 반환</li>
 *   <li>✅ Spring Security 통합: 자동으로 SecurityContext 설정</li>
 *   <li>✅ 명확한 에러 메시지: 권한별 사용자 친화적 메시지</li>
 * </ul>
 * 
 * <h3>사용 패턴:</h3>
 * <pre>{@code
 * // Controller에서 사용
 * @RequiredArgsConstructor
 * public class ExampleController {
 *     private final DynamicPermissionService dynamicPermissionService;
 *     
 *     @GetMapping("/data")
 *     public ResponseEntity<?> getData(HttpSession session) {
 *         ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
 *             session, "DATA_VIEW", dynamicPermissionService);
 *         if (check != null) {
 *             return check; // 401 또는 403 응답
 *         }
 *         // 권한 있음 - 비즈니스 로직 실행
 *     }
 * }
 * }</pre>
 * 
 * <p><b>참고:</b> 사용 가이드는 {@code docs/mgsb/PERMISSION_CHECK_UTILS_GUIDE.md}를 참조하세요.</p>
 * 
 * @author MindGarden
 * @version 2.0.0 (표준 유틸리티로 정의)
 * @since 2025-09-29
 * @see com.coresolution.consultation.service.DynamicPermissionService
 * @see docs/mgsb/PERMISSION_CHECK_UTILS_GUIDE.md
 */
@Slf4j
public class PermissionCheckUtils {
    
    /**
     * 기본 인증 체크 (로그인 여부만 확인)
     * 
     * @param session HTTP 세션
     * @return 인증된 사용자 정보 또는 null
     */
    public static User checkAuthentication(HttpSession session) {
        return SessionUtils.getCurrentUser(session);
    }
    
    /**
     * 인증 체크 및 401 응답 생성
     * 
     * @param session HTTP 세션
     * @return 인증된 사용자 정보 또는 401 응답
     */
    public static ResponseEntity<?> checkAuthenticationWithResponse(HttpSession session) {
        User currentUser = checkAuthentication(session);
        if (currentUser == null) {
            log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "로그인이 필요합니다."
            ));
        }
        return null; // 인증 성공
    }
    
    /**
     * 권한 체크 (동적 권한 시스템 사용)
     * 
     * @param session HTTP 세션
     * @param permissionCode 권한 코드
     * @param dynamicPermissionService 동적 권한 서비스
     * @return 권한이 있는 사용자 정보 또는 403 응답
     */
    public static ResponseEntity<?> checkPermission(HttpSession session, String permissionCode, 
                                                   DynamicPermissionService dynamicPermissionService) {
        log.info("🔍 권한 체크 시작: permissionCode={}", permissionCode);
        
        // 1. 인증 체크
        ResponseEntity<?> authResponse = checkAuthenticationWithResponse(session);
        if (authResponse != null) {
            log.warn("❌ 인증 실패: {}", authResponse.getBody());
            return authResponse;
        }
        
        User currentUser = checkAuthentication(session);
        log.info("🔍 현재 사용자: email={}, role={}, id={}", 
                currentUser.getEmail(), currentUser.getRole(), currentUser.getId());
        
        // 2. Spring Security 컨텍스트에 인증 정보 설정
        if (currentUser != null) {
            // Spring Security 컨텍스트에 인증 정보 설정
            org.springframework.security.core.Authentication authentication = createAuthentication(currentUser);
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
            log.info("✅ Spring Security 컨텍스트에 인증 정보 설정 완료");
        }
        
        // 3. ADMIN 역할은 모든 권한 자동 부여 (테넌트 시스템)
        boolean isAdmin = com.coresolution.consultation.util.AdminRoleUtils.isAdmin(currentUser);
        if (isAdmin) {
            log.info("✅ ADMIN 역할 자동 권한 부여: 사용자={}, 역할={}, 권한={}", 
                    currentUser.getEmail(), currentUser.getRole(), permissionCode);
            return null; // 권한 체크 성공
        }
        
        // 4. 일반 사용자는 동적 권한 체크
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
        log.info("🔍 권한 체크 결과: hasPermission={}, permissionCode={}, roleName={}", 
                hasPermission, permissionCode, currentUser.getRole().name());
        
        if (!hasPermission) {
            log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
                    currentUser.getEmail(), currentUser.getRole(), permissionCode);
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", getPermissionErrorMessage(permissionCode)
            ));
        }
        
        log.info("✅ 권한 체크 통과: 사용자={}, 권한={}", currentUser.getEmail(), permissionCode);
        return null; // 권한 체크 성공
    }
    
    /**
     * 사용자 정보로부터 Spring Security Authentication 객체 생성
     */
    private static org.springframework.security.core.Authentication createAuthentication(User user) {
        // 사용자 권한 설정
        java.util.Collection<org.springframework.security.core.GrantedAuthority> authorities = getAuthorities(user);
        
        // 인증된 토큰 생성
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authToken = 
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user.getEmail(), 
                null, // 비밀번호는 null로 설정 (이미 인증됨)
                authorities
            );
        
        // Principal에 사용자 정보 설정
        authToken.setDetails(user);
        
        return authToken;
    }
    
    /**
     * 사용자 역할에 따른 권한 생성
     */
    private static java.util.Collection<org.springframework.security.core.GrantedAuthority> getAuthorities(User user) {
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        
        // 기본 역할 권한 추가
        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // 추가 권한 설정
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
        if (user.getRole() == null) {
            return authorities;
        }
        
        switch (user.getRole()) {
            case ADMIN:
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
                break;
            case STAFF:
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
                break;
            case CONSULTANT:
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CONSULTANT"));
                break;
            case CLIENT:
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CLIENT"));
                break;
            default:
                log.warn("⚠️ 알 수 없는 사용자 역할: {}", user.getRole());
                break;
        }
        
        return authorities;
    }
    
    /**
     * 권한별 오류 메시지 생성
     * 
     * @param permissionCode 권한 코드
     * @return 사용자 친화적인 오류 메시지
     */
    private static String getPermissionErrorMessage(String permissionCode) {
        switch (permissionCode) {
            case "CONSULTANT_MANAGE":
                return "상담사 관리 권한이 없습니다.";
            case "CLIENT_MANAGE":
                return "내담자 관리 권한이 없습니다.";
            case "MAPPING_VIEW":
                return "매핑 조회 권한이 없습니다.";
            case "MAPPING_MANAGE":
                return "매핑 관리 권한이 없습니다.";
            case "SALARY_MANAGE":
                return "급여 관리 권한이 없습니다.";
            case "STATISTICS_VIEW":
                return "통계 조회 권한이 없습니다.";
            case "USER_MANAGE":
                return "사용자 관리 권한이 없습니다.";
            case "ALL_BRANCHES_VIEW":
                return "전체 지점 조회 권한이 없습니다.";
            case "SCHEDULE_MODIFY":
                return "스케줄 수정 권한이 없습니다.";
            case "SCHEDULE_CREATE":
                return "스케줄 생성 권한이 없습니다.";
            case "SCHEDULE_DELETE":
                return "스케줄 삭제 권한이 없습니다.";
            case "SCHEDULE_MANAGE":
                return "스케줄 관리 권한이 없습니다.";
            case "FINANCIAL_TRANSACTION_DELETE":
                return "재무 거래 삭제 권한이 없습니다. 테넌트 관리자(ADMIN)만 삭제할 수 있습니다.";
            default:
                return "해당 기능에 대한 접근 권한이 없습니다.";
        }
    }
    
    /**
     * 관리자 권한 체크 (기존 하드코딩된 권한 체크 대체)
     * 
     * @param session HTTP 세션
     * @param dynamicPermissionService 동적 권한 서비스
     * @return 권한이 있는 사용자 정보 또는 403 응답
     */
    public static ResponseEntity<?> checkAdminPermission(HttpSession session, 
                                                        DynamicPermissionService dynamicPermissionService) {
        return checkPermission(session, "USER_MANAGE", dynamicPermissionService);
    }
    
    /**
     * 통계 조회 권한 체크
     * 
     * @param session HTTP 세션
     * @param dynamicPermissionService 동적 권한 서비스
     * @return 권한이 있는 사용자 정보 또는 403 응답
     */
    public static ResponseEntity<?> checkStatisticsPermission(HttpSession session, 
                                                             DynamicPermissionService dynamicPermissionService) {
        return checkPermission(session, "STATISTICS_VIEW", dynamicPermissionService);
    }
}
