package com.coresolution.core.service;

/**
 * 테넌트 PG 설정 키 로테이션 서비스
 * 
 * <p>암호화 키 로테이션 시 PG 설정의 API Key와 Secret Key를 활성 키로 재암호화합니다.</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantPgConfigurationKeyRotationService {
    
    /**
     * 모든 PG 설정의 키를 활성 키로 재암호화합니다.
     * 
     * @return 재암호화된 PG 설정 수
     */
    int rotateAllPgConfigurations();
    
    /**
     * 특정 테넌트의 PG 설정 키를 활성 키로 재암호화합니다.
     * 
     * @param tenantId 테넌트 ID
     * @return 재암호화된 PG 설정 수
     */
    int rotateTenantPgConfigurations(String tenantId);
}

