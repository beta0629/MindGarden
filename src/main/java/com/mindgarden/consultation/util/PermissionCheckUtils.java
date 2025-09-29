package com.mindgarden.consultation.util;

import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 체크 공통 유틸리티
 * 모든 컨트롤러에서 일관성 있게 사용할 수 있는 권한 체크 메서드 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-29
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
        // 1. 인증 체크
        ResponseEntity<?> authResponse = checkAuthenticationWithResponse(session);
        if (authResponse != null) {
            return authResponse;
        }
        
        User currentUser = checkAuthentication(session);
        
        // 2. 권한 체크
        if (!dynamicPermissionService.hasPermission(currentUser, permissionCode)) {
            log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
                    currentUser.getEmail(), currentUser.getRole(), permissionCode);
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", getPermissionErrorMessage(permissionCode)
            ));
        }
        
        log.debug("✅ 권한 체크 통과: 사용자={}, 권한={}", currentUser.getEmail(), permissionCode);
        return null; // 권한 체크 성공
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
