package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.dto.PrivacyConsentDto;
import com.coresolution.consultation.entity.UserPrivacyConsent;

/**
 * 개인정보 동의 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface PrivacyConsentService {
    
    /**
     * 사용자의 개인정보 동의 상태 조회
     */
    Map<String, Object> getUserConsentStatus(Long userId);
    
    /**
     * 개인정보 동의 저장/업데이트
     */
    UserPrivacyConsent saveConsent(PrivacyConsentDto consentDto);
    
    /**
     * 개인정보 동의 상태 업데이트
     */
    Map<String, Object> updateConsentStatus(Long userId, Map<String, Object> consentData);
    
    /**
     * 개인정보 동의 이력 조회
     */
    Map<String, Object> getConsentHistory(Long userId);
}
