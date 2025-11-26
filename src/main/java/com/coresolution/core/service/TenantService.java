/**
 * 테넌트 서비스 인터페이스
 * 테넌트 정보 관리를 위한 서비스 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.service;

public interface TenantService {
    
    /**
     * 테넌트의 업종 타입 조회
     * @param tenantId 테넌트 ID
     * @return 업종 타입
     */
    String getBusinessType(String tenantId);
    
    /**
     * 테넌트 정보 존재 여부 확인
     * @param tenantId 테넌트 ID
     * @return 존재 여부
     */
    boolean existsTenant(String tenantId);
    
    /**
     * 테넌트 활성 상태 확인
     * @param tenantId 테넌트 ID
     * @return 활성 상태 여부
     */
    boolean isActiveTenant(String tenantId);
}
