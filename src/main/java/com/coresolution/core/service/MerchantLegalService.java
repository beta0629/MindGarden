package com.coresolution.core.service;

import com.coresolution.core.dto.MerchantLegalDto;
import com.coresolution.core.dto.MerchantLegalUpdateRequest;

/**
 * 테넌트 사업자·약관(merchant legal) 서비스.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
public interface MerchantLegalService {

    /**
     * 테넌트 사업자·약관 조회.
     *
     * @param tenantId 테넌트 ID
     * @return DTO
     */
    MerchantLegalDto getForTenant(String tenantId);

    /**
     * 테넌트 사업자·약관 저장. 사업자등록번호가 있으면 형식+체크섬 fail-closed.
     *
     * @param tenantId 테넌트 ID
     * @param request  저장 요청
     * @return 저장 후 DTO
     */
    MerchantLegalDto saveForTenant(String tenantId, MerchantLegalUpdateRequest request);

    /**
     * 엔티티 필드로부터 DTO 조립 (공개 홈·푸터용).
     *
     * @param centerName                   센터명
     * @param businessRegistrationNumber   사업자등록번호
     * @param representativeName           대표
     * @param businessLandline             유선
     * @param businessAddress              주소
     * @param mailOrderReportNumber        통신판매
     * @param refundPolicyText             환불 안내
     * @param productPriceGuideText        상품·가격 안내
     * @return DTO
     */
    MerchantLegalDto toDto(
            String centerName,
            String businessRegistrationNumber,
            String representativeName,
            String businessLandline,
            String businessAddress,
            String mailOrderReportNumber,
            String refundPolicyText,
            String productPriceGuideText);
}
