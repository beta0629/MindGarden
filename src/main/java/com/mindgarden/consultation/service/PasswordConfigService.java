package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * 비밀번호 설정 서비스 인터페이스
 * 공통코드를 사용한 비밀번호 정책 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface PasswordConfigService {
    
    /**
     * 비밀번호 정책 설정 조회
     */
    Map<String, Object> getPasswordPolicy();
    
    /**
     * 이메일 설정 조회
     */
    Map<String, Object> getEmailConfig();
    
    /**
     * 비밀번호 재설정 설정 조회
     */
    Map<String, Object> getPasswordResetConfig();
    
    /**
     * 설정값 조회 (공통코드에서)
     */
    String getConfigValue(String codeGroup, String codeValue, String defaultValue);
    
    /**
     * 설정값 조회 (숫자)
     */
    Integer getConfigIntValue(String codeGroup, String codeValue, Integer defaultValue);
    
    /**
     * 설정값 조회 (불린)
     */
    Boolean getConfigBooleanValue(String codeGroup, String codeValue, Boolean defaultValue);
}
