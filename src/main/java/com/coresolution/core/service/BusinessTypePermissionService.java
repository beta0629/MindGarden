/**
 * 업종별 권한 서비스 인터페이스
 * 동적 권한 관리를 위한 서비스 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.service;

import com.coresolution.core.constant.BusinessTypePermissions.ApiPermissionConfig;

import java.util.List;

public interface BusinessTypePermissionService {
    
    /**
     * API 접근 권한 확인
     * @param businessType 업종 타입
     * @param apiPath API 경로
     * @return 접근 권한 여부
     */
    boolean checkApiAccess(String businessType, String apiPath);
    
    /**
     * 업종별 허용 API 패턴 목록 조회
     * @param businessType 업종 타입
     * @return 허용된 API 패턴 목록
     */
    List<String> getAllowedApiPatterns(String businessType);
    
    /**
     * API 권한 설정 조회
     * @param apiPath API 경로
     * @return API 권한 설정
     */
    ApiPermissionConfig getApiPermissionConfig(String apiPath);
}
