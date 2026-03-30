package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 개인정보 동의 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyConsentCreateRequest {
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;
    
    @NotNull(message = "개인정보 처리방침 동의는 필수입니다.")
    private Boolean privacyConsent;
    
    @NotNull(message = "이용약관 동의는 필수입니다.")
    private Boolean termsConsent;
    
    private Boolean marketingConsent;
    
    private String ipAddress;
    
    private String userAgent;
}

