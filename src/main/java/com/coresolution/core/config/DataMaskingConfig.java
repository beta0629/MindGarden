package com.coresolution.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 민감정보 마스킹 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Configuration
@ConfigurationProperties(prefix = "security.data-masking")
@Data
public class DataMaskingConfig {
    
    /**
     * 마스킹 전역 활성화 여부
     * 운영: true, 개발: false
     */
    private boolean enabled = true;
    
    /**
     * 로그 출력 시 마스킹 여부
     */
    private boolean maskInLogs = true;
    
    /**
     * AI 분석 시 마스킹 여부
     */
    private boolean maskInAiAnalysis = true;
    
    /**
     * 외부 API 전송 시 마스킹 여부
     */
    private boolean maskInExternalApi = true;
    
    /**
     * 마스킹이 필요한지 확인
     */
    public boolean shouldMask() {
        return enabled;
    }
    
    /**
     * AI 분석 시 마스킹이 필요한지 확인
     */
    public boolean shouldMaskForAI() {
        return enabled && maskInAiAnalysis;
    }
    
    /**
     * 로그 출력 시 마스킹이 필요한지 확인
     */
    public boolean shouldMaskForLogs() {
        return enabled && maskInLogs;
    }
    
    /**
     * 외부 API 전송 시 마스킹이 필요한지 확인
     */
    public boolean shouldMaskForExternalApi() {
        return enabled && maskInExternalApi;
    }
}

