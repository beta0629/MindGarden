package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카드 가맹점 수수료 설정 저장 요청 DTO.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardMerchantFeeSettingsRequest {

    @DecimalMin(value = "0.0", message = "평균 요율은 0 이상이어야 합니다.")
    private BigDecimal averageRatePercent;

    @Valid
    private List<IssuerRateItem> issuerRates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssuerRateItem {

        @Size(max = 50, message = "카드사명은 50자 이하여야 합니다.")
        private String issuerLabel;

        @DecimalMin(value = "0.0", message = "요율은 0 이상이어야 합니다.")
        private BigDecimal ratePercent;
    }
}
