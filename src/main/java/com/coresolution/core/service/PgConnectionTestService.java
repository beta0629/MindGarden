package com.coresolution.core.service;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.dto.ConnectionTestResponse;

/**
 * PG 연결 테스트 서비스 인터페이스
 * 각 PG Provider별 연결 테스트 로직을 추상화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface PgConnectionTestService {
    
    /**
     * PG 연결 테스트 수행
     * 
     * @param configuration PG 설정 정보
     * @return 연결 테스트 결과
     */
    ConnectionTestResponse testConnection(TenantPgConfiguration configuration);
    
    /**
     * 지원하는 PG Provider 확인
     * 
     * @param provider PG Provider
     * @return 지원 여부
     */
    boolean supports(com.coresolution.core.domain.enums.PgProvider provider);
}

