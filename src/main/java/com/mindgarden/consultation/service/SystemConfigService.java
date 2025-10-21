package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Optional;

/**
 * 시스템 설정 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
public interface SystemConfigService {
    
    /**
     * 설정 값 조회
     */
    Optional<String> getConfigValue(String configKey);
    
    /**
     * 설정 값 조회 (기본값 포함)
     */
    String getConfigValue(String configKey, String defaultValue);
    
    /**
     * 설정 값 저장
     */
    void setConfigValue(String configKey, String configValue, String description, String category);
    
    /**
     * 카테고리별 설정 조회
     */
    List<String> getConfigsByCategory(String category);
    
    /**
     * OpenAI API 키 조회
     */
    String getOpenAIApiKey();
    
    /**
     * OpenAI API URL 조회
     */
    String getOpenAIApiUrl();
    
    /**
     * OpenAI 모델명 조회
     */
    String getOpenAIModel();
}
