package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카드 가맹점 수수료 설정 응답 DTO.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardMerchantFeeSettingsResponse {

    private Long id;
    private BigDecimal averageRatePercent;
    private List<IssuerRateItem> issuerRates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssuerRateItem {

        private Long id;
        private String issuerLabel;
        private BigDecimal ratePercent;
        private Integer sortOrder;
    }
}
