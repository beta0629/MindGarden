package com.coresolution.core.dto;

import com.coresolution.core.krpublic.BusinessVerificationResult;
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

    /** 개업일자. 컬럼이 없어 settings_json 에 저장한다. */
    private String openingDate;

    /**
     * 서버가 채우는 조회 결과. 클라이언트가 보낸 값은 저장 전에 버린다.
     */
    private BusinessVerificationResult businessVerification;
}
