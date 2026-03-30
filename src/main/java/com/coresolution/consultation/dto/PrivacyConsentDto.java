package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 개인정보 동의 DTO
 * 
 * @deprecated Use PrivacyConsentResponse, PrivacyConsentCreateRequest instead.
 * This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyConsentDto {
    
    private Long id;
    private Long userId;
    private Boolean privacyConsent;
    private Boolean termsConsent;
    private Boolean marketingConsent;
    private LocalDateTime consentDate;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
