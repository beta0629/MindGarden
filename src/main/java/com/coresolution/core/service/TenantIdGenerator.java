package com.coresolution.core.service;

/**
 * 테넌트 ID 생성기 인터페이스
 * 온보딩 승인 시 테넌트 ID를 자동 생성하는 전략을 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantIdGenerator {
    
    /**
     * 테넌트 ID 생성
     * 
     * @param tenantName 테넌트명 (선택적, null 가능)
     * @param businessType 업종 타입 (선택적, null 가능)
     * @param regionCode 지역 코드 (선택적, null 가능)
     * @return 생성된 테넌트 ID
     */
    String generateTenantId(String tenantName, String businessType, String regionCode);
    
    /**
     * 테넌트 ID 생성 (지역 코드 없이)
     * 
     * @param tenantName 테넌트명 (선택적, null 가능)
     * @param businessType 업종 타입 (선택적, null 가능)
     * @return 생성된 테넌트 ID
     */
    default String generateTenantId(String tenantName, String businessType) {
        return generateTenantId(tenantName, businessType, null);
    }
    
    /**
     * 테넌트 ID 생성 (테넌트명만 사용)
     * 
     * @param tenantName 테넌트명
     * @return 생성된 테넌트 ID
     */
    default String generateTenantId(String tenantName) {
        return generateTenantId(tenantName, null);
    }
    
    /**
     * 테넌트 ID 생성 (기본값)
     * 
     * @return 생성된 테넌트 ID
     */
    default String generateTenantId() {
        return generateTenantId(null, null);
    }
}

