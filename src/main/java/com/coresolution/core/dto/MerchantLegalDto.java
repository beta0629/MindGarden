package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 사업자·약관(merchant legal) DTO — 설정·온보딩·공개 푸터 공유 레코드.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantLegalDto {

    private String centerName;
    private String businessRegistrationNumber;
    private String representativeName;
    private String businessLandline;
    private String businessAddress;
    private String mailOrderReportNumber;
    private String refundPolicyText;
    private String productPriceGuideText;

    /** 등록 상태: UNREGISTERED | IN_PROGRESS | COMPLETE */
    private String registrationStatus;
    /** 통신판매 상태: UNREGISTERED | REGISTERED */
    private String mailOrderStatus;
    /** 사이트 공개 상태: PRIVATE | PUBLIC */
    private String sitePublicStatus;

    /** 등록 상태 한글 라벨 */
    private String registrationStatusLabel;
    /** 통신판매 상태 한글 라벨 */
    private String mailOrderStatusLabel;
    /** 사이트 공개 상태 한글 라벨 */
    private String sitePublicStatusLabel;
}
