package com.coresolution.consultation.service;

import java.util.Map;

/**
 * 비밀번호 검증 서비스 인터페이스
 * 공통코드 기반 비밀번호 정책 검증
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface PasswordValidationService {
    
    /**
     * 비밀번호 정책 검증
     */
    Map<String, Object> validatePassword(String password);
    
    /**
     * 비밀번호 강도 측정
     */
    Map<String, Object> measurePasswordStrength(String password);
    
    /**
     * 비밀번호 정책 요구사항 조회
     */
    Map<String, Object> getPasswordRequirements();
}
