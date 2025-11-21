package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.PrivacyConsentDto;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.service.PrivacyConsentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 동의 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrivacyConsentServiceImpl implements PrivacyConsentService {
    
    private final UserPrivacyConsentRepository userPrivacyConsentRepository;
    
    @Override
    public Map<String, Object> getUserConsentStatus(Long userId) {
        log.info("🔍 사용자 개인정보 동의 상태 조회: userId={}", userId);
        
        try {
            // 최신 동의 정보 조회
            Optional<UserPrivacyConsent> latestConsent = userPrivacyConsentRepository.findLatestByUserId(userId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (latestConsent.isPresent()) {
                UserPrivacyConsent consent = latestConsent.get();
                result.put("hasConsent", true);
                result.put("privacyConsent", consent.getPrivacyConsent());
                result.put("termsConsent", consent.getTermsConsent());
                result.put("marketingConsent", consent.getMarketingConsent());
                result.put("consentDate", consent.getConsentDate());
                result.put("isComplete", consent.getPrivacyConsent() && consent.getTermsConsent());
            } else {
                result.put("hasConsent", false);
                result.put("privacyConsent", false);
                result.put("termsConsent", false);
                result.put("marketingConsent", false);
                result.put("consentDate", null);
                result.put("isComplete", false);
            }
            
            log.info("✅ 사용자 개인정보 동의 상태 조회 완료: userId={}, hasConsent={}", 
                userId, result.get("hasConsent"));
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 사용자 개인정보 동의 상태 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 동의 상태 조회 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    @Transactional
    public UserPrivacyConsent saveConsent(PrivacyConsentDto consentDto) {
        log.info("💾 개인정보 동의 저장: userId={}", consentDto.getUserId());
        
        try {
            UserPrivacyConsent consent = UserPrivacyConsent.builder()
                .userId(consentDto.getUserId())
                .privacyConsent(consentDto.getPrivacyConsent())
                .termsConsent(consentDto.getTermsConsent())
                .marketingConsent(consentDto.getMarketingConsent())
                .consentDate(consentDto.getConsentDate() != null ? consentDto.getConsentDate() : LocalDateTime.now())
                .ipAddress(consentDto.getIpAddress())
                .userAgent(consentDto.getUserAgent())
                .build();
            
            UserPrivacyConsent savedConsent = userPrivacyConsentRepository.save(consent);
            
            log.info("✅ 개인정보 동의 저장 완료: id={}, userId={}", savedConsent.getId(), savedConsent.getUserId());
            
            return savedConsent;
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 저장 실패: userId={}, error={}", consentDto.getUserId(), e.getMessage(), e);
            throw new RuntimeException("개인정보 동의 저장 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    @Transactional
    public Map<String, Object> updateConsentStatus(Long userId, Map<String, Object> consentData) {
        log.info("🔄 개인정보 동의 상태 업데이트: userId={}", userId);
        
        try {
            Boolean privacyConsent = (Boolean) consentData.get("privacyConsent");
            Boolean termsConsent = (Boolean) consentData.get("termsConsent");
            Boolean marketingConsent = (Boolean) consentData.get("marketingConsent");
            String ipAddress = (String) consentData.get("ipAddress");
            String userAgent = (String) consentData.get("userAgent");
            
            // 필수 동의 항목 검증
            if (privacyConsent == null || termsConsent == null) {
                throw new IllegalArgumentException("개인정보 처리방침과 이용약관 동의는 필수입니다.");
            }
            
            // 새로운 동의 정보 저장
            PrivacyConsentDto consentDto = PrivacyConsentDto.builder()
                .userId(userId)
                .privacyConsent(privacyConsent)
                .termsConsent(termsConsent)
                .marketingConsent(marketingConsent != null ? marketingConsent : false)
                .consentDate(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
            
            UserPrivacyConsent savedConsent = saveConsent(consentDto);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "개인정보 동의 상태가 업데이트되었습니다.");
            result.put("consent", savedConsent);
            
            log.info("✅ 개인정보 동의 상태 업데이트 완료: userId={}", userId);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 상태 업데이트 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 동의 상태 업데이트 중 오류가 발생했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> getConsentHistory(Long userId) {
        log.info("📋 개인정보 동의 이력 조회: userId={}", userId);
        
        try {
            List<UserPrivacyConsent> consentHistory = userPrivacyConsentRepository.findByUserIdOrderByConsentDateDesc(userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("history", consentHistory);
            result.put("count", consentHistory.size());
            
            log.info("✅ 개인정보 동의 이력 조회 완료: userId={}, count={}", userId, consentHistory.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 개인정보 동의 이력 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("개인정보 동의 이력 조회 중 오류가 발생했습니다.", e);
        }
    }
}
