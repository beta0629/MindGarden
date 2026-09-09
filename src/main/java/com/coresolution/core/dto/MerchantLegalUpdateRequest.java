package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사업자·약관 저장 요청 (최소 7필드).
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantLegalUpdateRequest {

    private String businessRegistrationNumber;
    private String representativeName;
    private String businessLandline;
    private String businessAddress;
    private String mailOrderReportNumber;
    private String refundPolicyText;
    private String productPriceGuideText;
}
