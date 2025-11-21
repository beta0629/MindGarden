package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 개인정보 동의 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyConsentResponse {
    
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
    
    /**
     * PrivacyConsentDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 PrivacyConsentDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto PrivacyConsentDto (deprecated)
     * @return PrivacyConsentResponse
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static PrivacyConsentResponse fromDto(PrivacyConsentDto dto) {
        if (dto == null) {
            return null;
        }
        
        return PrivacyConsentResponse.builder()
            .id(dto.getId())
            .userId(dto.getUserId())
            .privacyConsent(dto.getPrivacyConsent())
            .termsConsent(dto.getTermsConsent())
            .marketingConsent(dto.getMarketingConsent())
            .consentDate(dto.getConsentDate())
            .ipAddress(dto.getIpAddress())
            .userAgent(dto.getUserAgent())
            .createdAt(dto.getCreatedAt())
            .updatedAt(dto.getUpdatedAt())
            .build();
    }
}

