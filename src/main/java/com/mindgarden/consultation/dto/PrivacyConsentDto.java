package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 개인정보 동의 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
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
