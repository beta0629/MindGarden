package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.UserRole;
import org.springframework.stereotype.Component;

/**
 * 대시보드 리다이렉션 유틸리티
 * 역할별 대시보드 경로를 중앙에서 관리
 */
@Component
public class DashboardRedirectUtil {
    
    /**
     * 역할별 대시보드 경로 매핑 (중앙 관리)
     */
    private static final String ROLE_DASHBOARD_BASE_URL = "/dashboard";
    
    /**
     * 사용자 역할에 따른 대시보드 경로 생성
     * 
     * @param userRole 사용자 역할
     * @param frontendBaseUrl 프론트엔드 기본 URL
     * @return 리다이렉트할 대시보드 URL
     */
    public static String getDashboardUrl(UserRole userRole, String frontendBaseUrl) {
        if (userRole == null || frontendBaseUrl == null) {
            return frontendBaseUrl + "/client/dashboard";
        }
        
        String dashboardPath = getDashboardPath(userRole);
        return frontendBaseUrl + dashboardPath;
    }
    
    /**
     * 사용자 역할에 따른 대시보드 경로 반환
     * 
     * @param userRole 사용자 역할
     * @return 대시보드 경로
     */
    public static String getDashboardPath(UserRole userRole) {
        if (userRole == null) {
            return "/client/dashboard";
        }
        
        // 표준화 2025-12-05: 표준 역할만 사용 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
        if (userRole == null) {
            return "/client/dashboard";
        }
        
        // 관리자 역할 체크 (표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER)
        if (userRole.isAdmin()) {
            return "/admin/dashboard";
        }
        
        switch (userRole) {
            case CLIENT:
                return "/client/dashboard";
            case CONSULTANT:
                return "/consultant/dashboard";
            case STAFF:
                return "/staff/dashboard";
            default:
                return "/client/dashboard";
        }
    }
    
    /**
     * 역할별 대시보드 설명 반환
     * 
     * @param userRole 사용자 역할
     * @return 대시보드 설명
     */
    public static String getDashboardDescription(UserRole userRole) {
        if (userRole == null) {
            return "기본 대시보드";
        }
        
        // 표준화 2025-12-05: 표준 역할만 사용 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
        if (userRole == null) {
            return "기본 대시보드";
        }
        
        // 관리자 역할 체크
        if (userRole.isAdmin()) {
            return "관리자 대시보드";
        }
        
        switch (userRole) {
            case CLIENT:
                return "내담자 대시보드";
            case CONSULTANT:
                return "상담사 대시보드";
            case STAFF:
                return "사무원 대시보드";
            default:
                return "기본 대시보드";
        }
    }
}
