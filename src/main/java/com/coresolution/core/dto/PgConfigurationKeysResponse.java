package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 설정 키 복호화 응답 DTO
 * 
 * <p>보안 주의: 이 DTO는 민감한 정보(API Key, Secret Key)를 포함합니다.
 * 로그에 출력하거나 응답에 포함할 때 주의해야 합니다.</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PgConfigurationKeysResponse {
    
    /**
     * PG 설정 ID
     */
    private String configId;
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * PG Provider
     */
    private String pgProvider;
    
    /**
     * 복호화된 API Key
     * 
     * <p>보안 주의: 이 필드는 민감한 정보입니다. 로그에 출력하지 마세요.</p>
     */
    private String apiKey;
    
    /**
     * 복호화된 Secret Key
     * 
     * <p>보안 주의: 이 필드는 민감한 정보입니다. 로그에 출력하지 마세요.</p>
     */
    private String secretKey;
    
    /**
     * 복호화 시각 (감사 목적)
     */
    private java.time.LocalDateTime decryptedAt;
    
    /**
     * 복호화 요청자 (감사 목적)
     */
    private String requestedBy;
}

