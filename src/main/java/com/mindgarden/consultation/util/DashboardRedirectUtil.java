package com.mindgarden.consultation.util;

import com.mindgarden.consultation.constant.UserRole;
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
        
        switch (userRole) {
            case CLIENT:
                return "/client/dashboard";
            case CONSULTANT:
                return "/consultant/dashboard";
            case ADMIN:
                return "/admin/dashboard";
            case BRANCH_SUPER_ADMIN:
                return "/super_admin/dashboard";  // 지점 수퍼 관리자는 수퍼 어드민 대시보드로
            case HQ_ADMIN:
                return "/erp/dashboard";  // 본사 관리자는 ERP 대시보드로
            case SUPER_HQ_ADMIN:
                return "/super_admin/dashboard";  // 본사 고급 관리자는 수퍼 어드민 대시보드로
            case HQ_MASTER:
                return "/super_admin/dashboard";  // 본사 총관리자는 수퍼 어드민 대시보드로
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
        
        switch (userRole) {
            case CLIENT:
                return "내담자 대시보드";
            case CONSULTANT:
                return "상담사 대시보드";
            case ADMIN:
                return "지점 관리자 대시보드";
            case BRANCH_SUPER_ADMIN:
                return "지점 수퍼 관리자 대시보드";
            case HQ_ADMIN:
                return "본사 관리자 대시보드 (ERP)";
            case SUPER_HQ_ADMIN:
                return "본사 고급 관리자 대시보드";
            case HQ_MASTER:
                return "본사 총관리자 대시보드";
            default:
                return "기본 대시보드";
        }
    }
}
