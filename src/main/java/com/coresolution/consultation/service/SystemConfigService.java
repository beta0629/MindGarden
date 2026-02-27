package com.coresolution.consultation.service;

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
    
    /**
     * 기본 AI 프로바이더 ID 조회 (openai | gemini | claude | replicate).
     * 없거나 빈 값이면 "openai" 반환.
     */
    String getAiDefaultProvider();
    
    /**
     * 기본 AI 프로바이더 저장
     */
    void setAiDefaultProvider(String providerId);
    
    /**
     * 지정 프로바이더의 API 키 조회
     */
    String getApiKeyForProvider(String providerId);
    
    /**
     * 지정 프로바이더의 API URL 조회
     */
    String getApiUrlForProvider(String providerId);
    
    /**
     * 지정 프로바이더의 모델명 조회
     */
    String getModelForProvider(String providerId);
    
    /**
     * USD-KRW 환율 조회
     */
    Double getUsdToKrwRate();
    
    /**
     * 환율 설정 저장
     */
    void setUsdToKrwRate(Double rate);
}
