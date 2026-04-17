package com.coresolution.core.dto;

import com.coresolution.core.domain.enums.PgProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 PG 설정 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationRequest {
    
    /**
     * PG사 제공자
     */
    @NotNull(message = "PG사는 필수입니다")
    private PgProvider pgProvider;
    
    /**
     * PG사 명칭 (커스텀)
     */
    @Size(max = 255, message = "PG사 명칭은 255자 이하여야 합니다")
    private String pgName;
    
    /**
     * API Key (평문 - 서비스에서 암호화하여 저장).
     * KICC 이지페이: 상점 연동용 키(KICC 콘솔·가이드에 따름, Phase 2 API별 사용).
     */
    @NotBlank(message = "API Key는 필수입니다")
    private String apiKey;
    
    /**
     * Secret Key (평문 - 서비스에서 암호화하여 저장).
     * KICC 이지페이: 상점 검증키(HMAC-SHA256 메시지 인증값, 승인·취소 등).
     */
    @NotBlank(message = "Secret Key는 필수입니다")
    private String secretKey;
    
    /**
     * Merchant ID.
     * KICC 이지페이: Mall ID(상점 ID, 8바이트).
     */
    @Size(max = 255, message = "Merchant ID는 255자 이하여야 합니다")
    private String merchantId;
    
    /**
     * Store ID
     */
    @Size(max = 255, message = "Store ID는 255자 이하여야 합니다")
    private String storeId;
    
    /**
     * Webhook URL
     */
    @Size(max = 500, message = "Webhook URL은 500자 이하여야 합니다")
    private String webhookUrl;
    
    /**
     * Return URL
     */
    @Size(max = 500, message = "Return URL은 500자 이하여야 합니다")
    private String returnUrl;
    
    /**
     * Cancel URL
     */
    @Size(max = 500, message = "Cancel URL은 500자 이하여야 합니다")
    private String cancelUrl;
    
    /**
     * 테스트 모드 여부
     */
    @Builder.Default
    private Boolean testMode = false;
    
    /**
     * PG별 추가 설정 (JSON 문자열)
     */
    private String settingsJson;
    
    /**
     * 비고
     */
    @Size(max = 1000, message = "비고는 1000자 이하여야 합니다")
    private String notes;
}

